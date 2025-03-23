import { Component, Injector, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseComponent } from 'src/app/modules/base.component';
import { ICreateKnowldege } from '../../create-account.helper';
import { AddInsightStepsService, DocumentParserResponse } from 'src/app/_fake/services/add-insight-steps/add-insight-steps.service';
import { delay, finalize, of } from 'rxjs';

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
  
  // Track loading state for each document
  documentLoadingStates: { [key: number]: boolean } = {};
  
  // Track error state for each document
  documentAbstractErrors: { [key: number]: boolean } = {};
  
  // Store TinyMCE editor instances
  editorInstances: { [key: number]: any } = {};

  // Animation control properties
  typingSpeed = 10; // ms per character
  animationTimers: { [key: number]: any } = {};

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
  
  // Store editor instance when initialized
  handleEditorInit(event: any, docId: number): void {
    this.editorInstances[docId] = event.editor;
    
    // Add change event listener to update document description on content change
    event.editor.on('Change', () => {
      const content = event.editor.getContent();
      this.updateDocumentDescription(docId, content);
    });
  }

  // Function to handle Generate AI Abstract button click for a specific document
  generateAIAbstract(docId: number): void {
    this.documentLoadingStates[docId] = true;
    this.documentAbstractErrors[docId] = false;
    
    // Set maximum time to show loader (15 seconds)
    const maxWaitTime = 15000;
    const pollingInterval = 2000; // Check every 2 seconds
    let elapsedTime = 0;
    let polling: any;
    
    // Start polling
    polling = setInterval(() => {
      elapsedTime += pollingInterval;
      
      // Call the fetchDocumentSummary method to check for summary
      this.fetchDocumentSummary(docId, polling);
      
      // Stop polling if we've reached the max time
      if (elapsedTime >= maxWaitTime) {
        clearInterval(polling);
        
        // Ensure loading state is turned off after max time
        if (this.documentLoadingStates[docId]) {
          this.documentLoadingStates[docId] = false;
          this.documentAbstractErrors[docId] = true; // Set error state if we couldn't get data after timeout
        }
      }
    }, pollingInterval);
  }

  // Fetch document summary from AI parser API
  fetchDocumentSummary(docId: number, pollingIntervalId?: any): void {
    // Loading state is already set to true when this is called
    
    const summarySubscription = this.addInsightStepsService.getDocumentSummary(docId)
      .subscribe({
        next: (response: DocumentParserResponse) => {
          const index = this.documents.findIndex(doc => doc.id === docId);
          if (index !== -1 && response.data) {
            // Check if data has a summary object with abstract property
            let summary = null;
            const responseData: any = response.data;
            
            if (typeof responseData === 'object' && responseData.summary && typeof responseData.summary === 'object') {
              summary = responseData.summary.abstract || null;
            } else if (typeof responseData === 'string') {
              summary = responseData;
            } else if (responseData.summary && typeof responseData.summary === 'string') {
              summary = responseData.summary;
            }
            
            if (summary) {
              // We have a valid abstract, use it directly
              const formattedDescription = summary;
              
              // Update document description with formatted content
              this.documents[index].description = formattedDescription;
              this.documents[index].touched = true;
              
              // Enable animation for this document
              this.documents[index].animatedAbstract = true;
              this.documents[index].animatedAbstractText = ''; // Start empty for typing animation
              this.documents[index].showEditor = false; // Hide editor initially
              
              // Start typing animation
              this.startTypingAnimation(docId, formattedDescription);
              
              // Validate and update parent model
              this.validateDocuments();
              this.updateParentModelWithDocuments();
              this.documentAbstractErrors[docId] = false;
              
              // Clear polling interval if we have a valid summary
              if (pollingIntervalId) {
                clearInterval(pollingIntervalId);
              }
              
              // Turn off loading
              this.documentLoadingStates[docId] = false;
            } else {
              // No summary data returned
              // Don't set error yet - continue polling until timeout
              if (!pollingIntervalId) {
                this.documentAbstractErrors[docId] = true;
                console.error(`No summary data returned for document ${docId}`);
                this.documentLoadingStates[docId] = false;
              }
            }
          } else {
            // No data returned or document not found
            // Don't set error yet - continue polling until timeout
            if (!pollingIntervalId) {
              this.documentAbstractErrors[docId] = true;
              console.error(`No data returned or document not found for document ${docId}`);
              this.documentLoadingStates[docId] = false;
            }
          }
        },
        error: (error) => {
          console.error(`Error getting document summary for document ${docId}:`, error);
          
          // Check if this is the specific metadata error we want to ignore
          const isMetadataError = error?.error?.message?.includes('Attempt to read property "metadata" on null');
          
          // Only update UI state if this was the final request OR if it's not the specific error we're ignoring
          if (!pollingIntervalId && !isMetadataError) {
            this.documentLoadingStates[docId] = false;
            this.documentAbstractErrors[docId] = true;
          }
          // If it's the metadata error and we're polling, we just continue polling until timeout
        }
      });
    
    this.unsubscribe.push(summarySubscription);
  }
  
  // Show editor for a document with animated abstract
  showEditor(docId: number): void {
    const index = this.documents.findIndex(doc => doc.id === docId);
    if (index !== -1) {
      this.documents[index].showEditor = true;
      
      // Update TinyMCE editor content with the full description
      if (this.editorInstances[docId]) {
        this.editorInstances[docId].setContent(this.documents[index].description);
      }
    }
  }
  
  // Start typing animation for abstract
  startTypingAnimation(docId: number, text: string): void {
    const index = this.documents.findIndex(doc => doc.id === docId);
    if (index === -1) return;
    
    const chars = text.length;
    let currentPos = 0;
    this.documents[index].animatedAbstractComplete = false;
    
    // Clear any existing animation timer
    if (this.animationTimers[docId]) {
      clearInterval(this.animationTimers[docId]);
    }
    
    // Start animation interval
    this.animationTimers[docId] = setInterval(() => {
      if (currentPos < chars) {
        // Add next character to the animated text
        this.documents[index].animatedAbstractText = text.substring(0, currentPos + 1);
        currentPos++;
      } else {
        // Animation complete
        clearInterval(this.animationTimers[docId]);
        this.documents[index].animatedAbstractComplete = true;
      }
    }, this.typingSpeed);
  }

  initForm(): void {
    this.form = this.fb.group({
      description: [this.defaultValues.description || '', []]
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
            
            // Initialize loading state for this document - start with false
            this.documentLoadingStates[doc.id] = false;
            // Initialize error state for this document
            this.documentAbstractErrors[doc.id] = false;
            
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
              touched: false,
              // For animation control
              animatedAbstract: false,
              animatedAbstractText: '',
              animatedAbstractComplete: false,
              showEditor: false
            };
          });
          
          // Set loading indicators immediately for documents without descriptions
          this.documents.forEach(doc => {
            if (!doc.description || doc.description.trim() === '') {
              this.documentLoadingStates[doc.id] = true;
            } else {
              // For documents that already have descriptions, we'll still show animation
              doc.animatedAbstract = true;
              doc.showEditor = false;
              // Start typing animation with a short delay to ensure UI is ready
              setTimeout(() => {
                this.startTypingAnimation(doc.id, doc.description);
              }, 500);
            }
          });
          
          this.isLoading = false;
          
          // After loading documents, validate them and update the parent model
          this.validateDocuments();
          this.updateParentModelWithDocuments();
          
          // For each document that needs a summary, start polling process
          this.documents.forEach(doc => {
            if (!doc.description || doc.description.trim() === '') {
              // Set maximum time to show loader (15 seconds)
              const maxWaitTime = 15000;
              const pollingInterval = 2000; // Check every 2 seconds
              let elapsedTime = 0;
              let polling: any;
              
              // Start polling
              polling = setInterval(() => {
                elapsedTime += pollingInterval;
                
                // Call the API to check for summary
                this.fetchDocumentSummary(doc.id, polling);
                
                // If we have a valid description now or reached max time, stop polling
                const index = this.documents.findIndex(d => d.id === doc.id);
                if ((index !== -1 && this.documents[index].description && this.documents[index].description.trim() !== '') || elapsedTime >= maxWaitTime) {
                  clearInterval(polling);
                  
                  // Update TinyMCE editor content if editor instance exists and we have content
                  if (index !== -1 && this.documents[index].description && this.editorInstances[doc.id]) {
                    this.editorInstances[doc.id].setContent(this.documents[index].description);
                  }
                  
                  // Ensure loading state is turned off after max time
                  if (elapsedTime >= maxWaitTime && this.documentLoadingStates[doc.id]) {
                    this.documentLoadingStates[doc.id] = false;
                    this.documentAbstractErrors[doc.id] = true; // Set error state if we couldn't get data after timeout
                  }
                }
              }, pollingInterval);
            }
          });
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
        this.validationErrors[`documents.${index}.description`] = ["The document description field is required."];
      }
      
      this.validateDocuments();
      this.updateParentModelWithDocuments();
    }
  }

  toggleChapters(docId: number): void {
    const index = this.documents.findIndex(doc => doc.id === docId);
    if (index !== -1) {
      this.documents[index].showChapters = !this.documents[index].showChapters;
      
      // Initialize table_of_content as an empty array if toggled on
      if (this.documents[index].showChapters) {
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
      this.documents[docIndex].table_of_content = []; // Set to empty array instead of undefined
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
      
      if (doc.showChapters) {
        // Always include table_of_content when chapters are enabled
        result.table_of_content = doc.table_of_content || [];
      } else {
        // Include empty array for table_of_content when not enabled
        result.table_of_content = [];
      }
      
      return result;
    });
    
    // Pass the form validity status that considers both the main form and document descriptions
    this.updateParentModel(
      { 
        description: this.form.get('description')?.value, // Keep for UI purposes but it won't be sent to API
        documentDescriptions 
      },
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