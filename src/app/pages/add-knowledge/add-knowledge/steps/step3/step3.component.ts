import { Component, Injector, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseComponent } from 'src/app/modules/base.component';
import { ICreateKnowldege } from '../../create-account.helper';
import { AddInsightStepsService } from 'src/app/_fake/services/add-insight-steps/add-insight-steps.service';

// Add the Chapter interface
export interface Chapter {
  chapter: {
    title: string;
    sub_child: { title: string; }[];
  };
}

// Interface for chapter in UI
interface ChapterItem {
  title: string;
}

@Component({
  selector: 'app-step3',
  templateUrl: './step3.component.html',
  styleUrls: ['./step3.component.scss']
})
export class Step3Component extends BaseComponent implements OnInit {
  @Input('updateParentModel') updateParentModel: (
    part: Partial<ICreateKnowldege>,
    isFormValid: boolean
  ) => void;
  @Input() defaultValues: Partial<ICreateKnowldege>;
  @Input() knowledgeId!: number;

  form: FormGroup;
  isLoading = false;
  documents: any[] = [];
  validationErrors: { [key: string]: string[] } = {};
  isCurrentFormValid = false;

  constructor(
    injector: Injector,
    private fb: FormBuilder,
    private addInsightStepsService: AddInsightStepsService
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.initForm();
    this.loadDocuments();
  }

  initForm(): void {
    this.form = this.fb.group({
      description: [this.defaultValues.description || '', [Validators.required]]
    });

    const formChanges = this.form.valueChanges.subscribe(val => {
      // Merge document descriptions with the main description
      const documentDescriptions = this.documents.map(doc => ({
        id: doc.id,
        description: doc.description || '',
        table_of_content: doc.table_of_content || undefined
      }));

      this.updateParentModel(
        { 
          description: val.description,
          documentDescriptions
        },
        this.form.valid
      );
    });

    this.unsubscribe.push(formChanges);
  }

  loadDocuments(): void {
    if (!this.knowledgeId) return;
    
    this.isLoading = true;
    const loadSub = this.addInsightStepsService.getListDocumentsInfo(this.knowledgeId)
      .subscribe({
        next: (response) => {
          this.documents = response.data.map(doc => {
            // Check if there's existing table_of_content data
            const hasTableOfContent = doc.table_of_content && Array.isArray(doc.table_of_content) && doc.table_of_content.length > 0;
            
            // Initialize chapters array from table_of_content if it exists
            const chapters = hasTableOfContent 
              ? doc.table_of_content.map((item: any) => ({ 
                  title: item.chapter.title 
                })) 
              : [];
            
            return {
              ...doc,
              fileIcon: this.getFileIconByExtension(doc.file_extension),
              // Show chapters section if there are existing chapters
              showChapters: hasTableOfContent,
              // Initialize chapters from existing table_of_content
              chapters: chapters,
              newChapterTitle: '',
              // Track validation errors for each document
              hasError: false,
              // Track if the field has been touched
              touched: false
            };
          });
          this.isLoading = false;
          
          // After loading documents, validate them and update the parent model
          this.validateDocuments();
          this.updateParentModelWithDocuments();
        },
        error: (error) => {
          console.error('Error loading documents:', error);
          this.isLoading = false;
        }
      });
    
    this.unsubscribe.push(loadSub);
  }

  updateDocumentDescription(docId: number, description: string): void {
    const index = this.documents.findIndex(doc => doc.id === docId);
    if (index !== -1) {
      this.documents[index].description = description;
      // Mark as touched once the user interacts with the field
      this.documents[index].touched = true;
      
      // Validate the field
      if (description && description.trim()) {
        this.documents[index].hasError = false;
        delete this.validationErrors[`documents.${index}.description`];
      } else {
        this.documents[index].hasError = true;
        this.validationErrors[`documents.${index}.description`] = ["The description field is required."];
      }
      
      this.validateDocuments();
      this.updateParentModelWithDocuments();
    }
  }

  // Toggle chapters visibility
  toggleChapters(docId: number): void {
    const index = this.documents.findIndex(doc => doc.id === docId);
    if (index !== -1) {
      this.documents[index].showChapters = !this.documents[index].showChapters;
      
      // Initialize table_of_content if it doesn't exist
      if (this.documents[index].showChapters && !this.documents[index].table_of_content) {
        this.documents[index].table_of_content = [];
      }
      
      // Clean up if toggled off
      if (!this.documents[index].showChapters) {
        this.documents[index].table_of_content = undefined;
        this.documents[index].chapters = [];
        this.documents[index].newChapterTitle = '';
      }
      
      this.updateParentModelWithDocuments();
    }
  }

  // Add a new chapter
  addChapter(docId: number): void {
    const index = this.documents.findIndex(doc => doc.id === docId);
    if (index !== -1 && this.documents[index].newChapterTitle.trim()) {
      // Initialize chapters array if it doesn't exist
      if (!this.documents[index].chapters) {
        this.documents[index].chapters = [];
      }
      
      // Add chapter to UI list
      this.documents[index].chapters.push({
        title: this.documents[index].newChapterTitle.trim()
      });
      
      // Update table_of_content for API
      this.updateTableOfContent(index);
      
      // Clear input
      this.documents[index].newChapterTitle = '';
      
      this.updateParentModelWithDocuments();
    }
  }

  // Remove a chapter
  removeChapter(docId: number, chapterIndex: number): void {
    const docIndex = this.documents.findIndex(doc => doc.id === docId);
    if (docIndex !== -1 && this.documents[docIndex].chapters) {
      this.documents[docIndex].chapters.splice(chapterIndex, 1);
      this.updateTableOfContent(docIndex);
      this.updateParentModelWithDocuments();
    }
  }

  // Update the table_of_content based on chapters
  private updateTableOfContent(docIndex: number): void {
    if (this.documents[docIndex].chapters && this.documents[docIndex].chapters.length > 0) {
      this.documents[docIndex].table_of_content = this.documents[docIndex].chapters.map((chapter: ChapterItem) => ({
        chapter: {
          title: chapter.title,
          sub_child: [] // Always empty array as per requirements
        }
      }));
    } else {
      this.documents[docIndex].table_of_content = undefined;
    }
  }

  // Validate all documents and update form validity
  private validateDocuments(): void {
    this.validationErrors = {};
    let isValid = true;
    
    // First check the main description (already handled by form validators)
    if (!this.form.get('description')?.valid) {
      isValid = false;
    }
    
    // Then check each document's description
    this.documents.forEach((doc, index) => {
      // Track error state regardless of touched state for form validity
      if (!doc.description || !doc.description.trim()) {
        // Only update visible error state if touched
        if (doc.touched) {
          doc.hasError = true;
          this.validationErrors[`documents.${index}.description`] = ["The document description field is required."];
        }
        isValid = false;
      } else {
        doc.hasError = false;
      }
    });
    
    // Update the form's validity
    if (this.form.valid && isValid) {
      this.isCurrentFormValid = true;
    } else {
      this.isCurrentFormValid = false;
    }
  }

  // Update parent model with all document descriptions and table_of_content
  private updateParentModelWithDocuments(): void {
    const documentDescriptions = this.documents.map(doc => {
      const result: any = {
        id: doc.id,
        description: doc.description || ''
      };
      
      if (doc.showChapters && doc.table_of_content && doc.table_of_content.length > 0) {
        result.table_of_content = doc.table_of_content;
      }
      
      return result;
    });
    
    // Pass the form validity status that considers both the main form and document descriptions
    this.updateParentModel(
      { documentDescriptions },
      this.form.valid && !this.hasDocumentErrors()
    );
  }

  // Helper method to check if there are any document errors
  private hasDocumentErrors(): boolean {
    return this.documents.some(doc => doc.hasError || !doc.description || !doc.description.trim());
  }

  private getFileIconByExtension(extension: string): string {
    const iconMap: { [key: string]: string } = {
      pdf: './assets/media/svg/new-files/pdf.svg',
      doc: './assets/media/svg/new-files/doc.svg',
      docx: './assets/media/svg/new-files/docx.svg',
      xls: './assets/media/svg/new-files/xls.svg',
      xlsx: './assets/media/svg/new-files/xlsx.svg',
      ppt: './assets/media/svg/new-files/ppt.svg',
      pptx: './assets/media/svg/new-files/pptx.svg',
      txt: './assets/media/svg/new-files/txt.svg',
      zip: './assets/media/svg/new-files/zip.svg',
      rar: './assets/media/svg/new-files/zip.svg'
    };
    return iconMap[extension?.toLowerCase()] || './assets/media/svg/files/default.svg';
  }
} 