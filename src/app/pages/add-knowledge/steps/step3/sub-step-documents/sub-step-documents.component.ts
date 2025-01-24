import { Component, Injector, Input, OnInit } from '@angular/core';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { BaseComponent } from 'src/app/modules/base.component';
import { ICreateKnowldege } from '../../../create-account.helper';
import { trigger, transition, style, animate } from '@angular/animations';
import { AddInsightStepsService } from 'src/app/_fake/services/add-insight-steps/add-insight-steps.service';

interface DocumentInfo {
  id: number;
  file_name: string;
  file_extension: string;
  price: number;
  docUrl?: string;
  fromServer?: boolean;
  file: File | null;
  status?: string;
  file_size?: number;
}

@Component({
  selector: 'app-sub-step-documents',
  templateUrl: './sub-step-documents.component.html',
  styleUrl: './sub-step-documents.component.scss',
  animations: [
    trigger('fadeInMoveY', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ])
  ]
})
export class SubStepDocumentsComponent extends BaseComponent implements OnInit {
  @Input('updateParentModel') updateParentModel: (
    part: Partial<ICreateKnowldege>,
    isFormValid: boolean
  ) => void;

  @Input('defaultValues') defaultValues: ICreateKnowldege;
  documentsForm: FormGroup;
  totalPrice: number = 0;
  documents: any[] = [];

  constructor(
    injector: Injector,
    private fb: FormBuilder,
    private addInsightStepsService: AddInsightStepsService
  ) {
    super(injector);
    this.documentsForm = this.fb.group({
      documents: this.fb.array([])
    });

    // Update total price whenever form changes
    this.documentsForm.valueChanges.subscribe(() => {
      // Update documents array with latest form values
      this.documentControls.controls.forEach((control, index) => {
        if (this.documents[index]) {
          const price = Number(control.get('price')?.value) || 0;
          this.documents[index] = {
            ...this.documents[index],
            file_name: control.get('file_name')?.value,
            price: price
          };
        }
      });
      
      this.calculateTotalPrice();
      const isValid = this.validateDocuments();
      this.updateParentModel({ documents: this.documents }, isValid);
    });
  }

  ngOnInit(): void {
    if (this.defaultValues?.knowledgeId) {
      this.fetchDocumentsFromServer();
    } else if (this.defaultValues?.documents?.length) {
      this.loadDocuments(this.defaultValues.documents);
    } else {
      this.addDocument();
    }
  }

  get documentControls(): FormArray {
    return this.documentsForm.get('documents') as FormArray;
  }

  private createDocument(): FormGroup {
    return this.fb.group({
      file_name: ['', [Validators.required, this.uniqueFileNameValidator()]],
      price: [0], 
      file: [null],
      filePreview: [false],
      fileIcon: [''],
      file_extension: [''],
      fromServer: [false],
      docId: [null],
      file_size: [null],
      docUrl: ['']
    });
  }

  addDocument(): void {
    const newDocGroup = this.createDocument();
    this.documentControls.push(newDocGroup);
    
    // Add a new empty document to the documents array
    const emptyDoc: DocumentInfo = {
      id: 0,
      file_name: '',
      file_extension: '',
      price: 0,
      file: null,
      fromServer: false
    };
    this.documents.push(emptyDoc);
    
    // Mark the form as invalid by triggering validation
    this.updateParentModel({ documents: this.documents }, false);
    
    // Subscribe to this specific document's value changes
    const index = this.documentControls.length - 1;
    const docControl = this.documentControls.at(index);
    
    docControl.valueChanges.subscribe(() => {
      const isValid = this.validateDocuments();
      this.updateParentModel({ documents: this.documents }, isValid);
    });
  }

  removeDocument(index: number): void {
    const doc = this.documents[index];
    if (doc) {
      if (doc.fromServer && doc.id && this.defaultValues?.knowledgeId) {
        // Delete from server first
        this.addInsightStepsService.deleteKnowledgeDocument(doc.id)
          .subscribe({
            next: () => {
              this.documents.splice(index, 1);
              this.documentControls.removeAt(index);
              this.updateParentModel({ documents: this.documents }, this.validateDocuments());
            },
            error: (error) => {
              this.showError('', 'Failed to delete document');
              console.error('Error deleting document:', error);
            }
          });
      } else {
        // Local document, just remove from array
        this.documents.splice(index, 1);
        this.documentControls.removeAt(index);
        this.updateParentModel({ documents: this.documents }, this.validateDocuments());
      }
    }
  }

  triggerFileInput(index: number): void {
    document.getElementById('fileInput' + index)?.click();
  }

  onFileSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      const extension = this.getFileExtension(file.name);
      const docGroup = this.documentControls.at(index);
      
      // Update form control without changing the file_name
      docGroup.patchValue({
        file: file,
        filePreview: true,
        fileIcon: this.getFileIconByExtension(extension), 
        file_extension: extension,
        fromServer: false,
        docId: null,
        file_size: file.size
      });

      // Update documents array
      const localDoc: DocumentInfo = {
        id: 0,
        file_name: docGroup.get('file_name')?.value || '', 
        file_extension: extension,
        price: Number(docGroup.get('price')?.value) || 0,
        file: file,
        fromServer: false,
        file_size: file.size,
        status: 'active'
      };

      if (this.documents[index]) {
        this.documents[index] = localDoc;
      } else {
        this.documents.push(localDoc);
      }

      this.updateParentModel({ documents: this.documents }, this.validateDocuments());
    }
  }

  private fetchDocumentsFromServer(): void {
    if (!this.defaultValues?.knowledgeId) return;

    this.addInsightStepsService.getListDocumentsInfo(this.defaultValues.knowledgeId)
      .subscribe({
        next: (response) => {
          const documentInfos = response.data;
          // Clear existing documents before adding server documents
          this.documents = [];
          this.documentControls.clear();
          
          documentInfos.forEach(docInfo => {
            this.addInsightStepsService.getDocumentUrl(docInfo.id)
              .subscribe({
                next: (urlResponse) => {
                  const serverDoc: DocumentInfo = {
                    id: docInfo.id,
                    file_name: docInfo.file_name || 'Untitled Document',
                    file_extension: docInfo.file_extension || '',
                    price: Number(docInfo.price) || 0,
                    docUrl: urlResponse.data.url,
                    fromServer: true,
                    file: null,
                    status: 'active',
                    file_size: docInfo.file_size || 0
                  };
                  
                  this.documents.push(serverDoc);
                  
                  // Create and update form control
                  const docGroup = this.createDocument();
                  docGroup.patchValue({
                    file_name: serverDoc.file_name,
                    price: serverDoc.price,
                    filePreview: true,
                    fileIcon: this.getFileIconByExtension(docInfo.file_extension || ''),
                    file_extension: serverDoc.file_extension,
                    fromServer: true,
                    docId: serverDoc.id,
                    file_size: serverDoc.file_size,
                    docUrl: serverDoc.docUrl
                  });
                  this.documentControls.push(docGroup);
                  
                  this.updateParentModel({ documents: this.documents }, this.validateDocuments());
                  this.calculateTotalPrice();
                },
                error: (error) => {
                  console.error(`Error fetching URL for document ${docInfo.id}:`, error);
                }
              });
          });
        },
        error: (error) => {
          console.error('Error fetching documents:', error);
        }
      });
  }

  private loadDocuments(documents: any[]): void {
    this.documents = documents;
    this.documentControls.clear();
    
    documents.forEach(doc => {
      const docGroup = this.createDocument();
      docGroup.patchValue({
        file_name: doc.file_name,
        price: Number(doc.price) || 0,
        file: doc.file,
        filePreview: true,
        fileIcon: this.getFileIconByExtension(doc.file_extension),
        file_extension: doc.file_extension,
        fromServer: doc.fromServer,
        docId: doc.id,
        file_size: doc.file_size,
        docUrl: doc.docUrl
      });
      this.documentControls.push(docGroup);
    });

    // Update parent model after loading documents
    this.updateParentModel({ documents: this.documents }, this.validateDocuments());
  }

  private getFileExtension(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    return extension;
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
    return iconMap[extension.toLowerCase()] || './assets/media/svg/files/default.svg';
  }

  private uniqueFileNameValidator() {
    return (control: any) => {
      if (!control.value) return null;
      
      const currentIndex = this.documentControls?.controls.findIndex(
        group => group.get('file_name') === control
      );
      
      const isDuplicate = this.documentControls?.controls.some(
        (group, index) => 
          index !== currentIndex && 
          group.get('file_name')?.value?.toLowerCase() === control.value.toLowerCase()
      );
      
      return isDuplicate ? { duplicateFileName: true } : null;
    };
  }

  private validateDocuments(): boolean {
    if (!this.documents.length) {
      return false;
    }

    // Check for duplicate file names
    const fileNames = new Set<string>();
    
    for (let i = 0; i < this.documents.length; i++) {
      const doc = this.documents[i];
      const control = this.documentControls.at(i);
      
      // Check if file name exists and is not empty
      if (!doc.file_name?.trim()) {
        return false;
      }

      // Check for duplicate file names (case insensitive)
      const lowerFileName = doc.file_name.toLowerCase();
      if (fileNames.has(lowerFileName)) {
        return false;
      }
      fileNames.add(lowerFileName);

      // Validate file requirement based on source
      if (!doc.fromServer) {
        // Local file: must have either a file or a docUrl
        if (!doc.file && !doc.docUrl) {
          return false;
        }
      } else {
        // Server file: must have a docUrl
        if (!doc.docUrl) {
          return false;
        }
      }

      // Check if the form control has any validation errors
      if (control.get('file_name')?.errors) {
        return false;
      }
    }

    return true;
  }

  private calculateTotalPrice(): void {
    this.totalPrice = this.documentControls.controls.reduce((sum, control) => {
      const price = parseFloat(control.get('price')?.value) || 0;
      return sum + price;
    }, 0);
  }
}
