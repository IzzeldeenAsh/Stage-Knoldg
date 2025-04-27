import { Component, Injector, Input, OnInit } from '@angular/core';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { BaseComponent } from 'src/app/modules/base.component';
import { ICreateKnowldege, IDocument } from '../../../create-account.helper';
import { trigger, transition, style, animate } from '@angular/animations';
import { AddInsightStepsService } from 'src/app/_fake/services/add-insight-steps/add-insight-steps.service';

// Define DocumentInfo as a type that matches our requirements
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
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error';
  uploadProgress?: number;
  errorMessage?: string;
  isCharity?: boolean;
  originalFileName?: string; // To track if name has changed
  originalPrice?: number;    // To track if price has changed
  table_of_content?: Array<{ chapter: { title: string } }>; // Added to match IDocument
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
  documents: DocumentInfo[] = [];
  uploadsInProgress: boolean = false;
  hasActiveUploads = false;
  pendingUploads: number = 0;

  constructor(
    injector: Injector,
    private fb: FormBuilder,
    private addInsightStepsService: AddInsightStepsService
  ) {
    super(injector);
    this.documentsForm = this.fb.group({
      documents: this.fb.array([])
    });

    // Update total price whenever form d
    this.documentsForm.valueChanges.subscribe(() => {
      // Update documents array with latest form values
      this.documentControls.controls.forEach((control, index) => {
        if (this.documents[index]) {
          const price = Number(control.get('price')?.value) || 0;
          const isCharity = control.get('isCharity')?.value || false;
          this.documents[index] = {
            ...this.documents[index],
            file_name: control.get('file_name')?.value,
            price: price,
            isCharity: isCharity
          };
        }
      });
      
      this.calculateTotalPrice();
      const isValid = this.validateDocuments();
      this.updateParentModel({ documents: this.documents as IDocument[] }, isValid);
    });
  }

  ngOnInit(): void {
    if (this.defaultValues?.knowledgeId) {
      this.fetchDocumentsFromServer();
    } else if (this.defaultValues?.documents?.length) {
      this.loadDocuments(this.defaultValues.documents);
    } else {
      // Make sure parent model is updated even with empty document array
      this.updateParentModel({ documents: [] }, false);
    }
  }

  get documentControls(): FormArray {
    return this.documentsForm.get('documents') as FormArray;
  }

  private createDocument(): FormGroup {
    const group = this.fb.group({
      file_name: ['', [Validators.required, this.uniqueFileNameValidator()]],
      price: [0, [Validators.required, Validators.min(0)]],
      isCharity: [false],
      file: [null],
      filePreview: [false],
      fileIcon: [''],
      file_extension: [''],
      fromServer: [false],
      docId: [null],
      file_size: [null],
      docUrl: [''],
      uploadStatus: ['pending'],
      uploadProgress: [0],
      errorMessage: ['']
    });
  
    // Disable/enable price control based on charity toggle
    group.get('isCharity')?.valueChanges.subscribe(isCharity => {
      const priceControl = group.get('price');
      if (isCharity) {
        priceControl?.setValue(0);
        priceControl?.disable();
      } else {
        priceControl?.enable();
      }
    });
  
    return group;
  }

  addDocument(): void {
    this.triggerMultipleFileInput();
  }

  removeDocument(index: number): void {
    const doc = this.documents[index];
    if (doc) {
      console.log(`Removing document at index ${index}:`, doc);
      
      // Get the document ID either from id or docId property
      const documentId = doc.id || (this.documentControls.at(index)?.get('docId')?.value);
      console.log(`Document ID: ${documentId}, Upload Status: ${doc.uploadStatus}`);
      
      // Check if document has an ID (regardless of fromServer flag)
      // Since we're now auto-uploading files, they all get IDs
      if (documentId) {
        console.log(`Deleting document from server with ID: ${documentId}`);
        
        // Delete from server first
        this.addInsightStepsService.deleteKnowledgeDocument(documentId)
          .subscribe({
            next: (response) => {
              console.log(`Document deleted successfully from server:`, response);
              this.documents.splice(index, 1);
              this.documentControls.removeAt(index);
              this.calculateTotalPrice();
              this.updateParentModel({ documents: this.documents as IDocument[] }, this.validateDocuments());
              this.showSuccess('', 'Document deleted successfully');
            },
            error: (error) => {
              console.error('Error deleting document from server:', error);
              
              // Show detailed error message
              let errorMessage = 'Failed to delete document';
              if (error.error && error.error.message) {
                errorMessage += `: ${error.error.message}`;
              } else if (error.message) {
                errorMessage += `: ${error.message}`;
              }
              
              this.showError('', errorMessage);
              
              // In case of deletion error, we still want to remove the document from the UI
              // to prevent UI inconsistency
              this.documents.splice(index, 1);
              this.documentControls.removeAt(index);
              this.calculateTotalPrice();
              this.updateParentModel({ documents: this.documents as IDocument[] }, this.validateDocuments());
            }
          });
      } else {
        console.log(`Document has no ID, removing locally only`);
        // Local document, just remove from array
        this.documents.splice(index, 1);
        this.documentControls.removeAt(index);
        this.calculateTotalPrice();
        this.updateParentModel({ documents: this.documents as IDocument[] }, this.validateDocuments());
      }
    }
  }

  triggerFileInput(index: number): void {
    // iOS Safari often requires a small delay
    // This helps ensure the click event fires correctly on iPad
    setTimeout(() => {
      document.getElementById('fileInput' + index)?.click();
    }, 0);
  }

  triggerMultipleFileInput(): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt';
    
    // Add capture attribute for iOS devices
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    if (isIOS) {
      // Use the environment capture for iOS devices
      fileInput.setAttribute('capture', 'environment');
    }
    
    fileInput.onchange = (event: any) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        this.handleMultipleFiles(files);
      }
    };
    
    // Ensure click event triggers properly on iOS
    setTimeout(() => {
      fileInput.click();
    }, 0);
  }

  // Queue to store files for sequential upload
  private fileUploadQueue: File[] = [];
  private isUploadInProgress = false;
  
  handleMultipleFiles(files: FileList): void {
    // Convert FileList to array and add to upload queue
    const filesArray = Array.from(files);
    this.fileUploadQueue.push(...filesArray);
    
    console.log(`Added ${filesArray.length} files to upload queue. Queue size: ${this.fileUploadQueue.length}`);
    
    // Start sequential upload process if not already in progress
    if (!this.isUploadInProgress) {
      this.processNextFileInQueue();
    }
  }
  
  private processNextFileInQueue(): void {
    if (this.fileUploadQueue.length === 0) {
      this.isUploadInProgress = false;
      console.log('File upload queue is empty. All uploads complete.');
      return;
    }
    
    this.isUploadInProgress = true;
    const file = this.fileUploadQueue.shift();
    
    if (!file) {
      this.isUploadInProgress = false;
      return;
    }
    
    console.log(`Processing next file in queue: ${file.name}`);
    
    const extension = this.getFileExtension(file.name);
    const fileName = file.name.replace(`.${extension}`, ''); // Remove extension from filename
    
    // Create new document form group
    const newDocGroup = this.createDocument();
    
    // Set initial values based on the file
    newDocGroup.patchValue({
      file_name: fileName,
      file: file,
      filePreview: true,
      fileIcon: this.getFileIconByExtension(extension),
      file_extension: extension,
      fromServer: false,
      file_size: file.size,
      uploadStatus: 'pending',
      uploadProgress: 0,
      errorMessage: ''
    });
    
    const docIndex = this.documentControls.length;
    this.documentControls.push(newDocGroup);
    
    // Add to documents array
    const localDoc: DocumentInfo = {
      id: 0,
      file_name: fileName,
      file_extension: extension,
      price: Number(newDocGroup.get('price')?.value) || 0,
      file: file,
      fromServer: false,
      file_size: file.size,
      status: 'active',
      uploadStatus: 'pending',
      uploadProgress: 0,
      errorMessage: '',
      isCharity: false,
      table_of_content: [] // Initialize empty table_of_content
    };
    
    this.documents.push(localDoc);
    
    // Start uploading the file
    this.uploadFileOnly(docIndex, true);
  }

  onFileSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      const extension = this.getFileExtension(file.name);
      const fileName = file.name.replace(`.${extension}`, ''); // Extract file name without extension
      const docGroup = this.documentControls.at(index);
      
      // Get current document info
      const currentDoc = this.documents[index];
      const isExistingDocument = currentDoc && currentDoc.fromServer;
      const wasErrorState = currentDoc && currentDoc.uploadStatus === 'error';
      
      // Check for duplicate file names across all documents
      const isDuplicate = this.isDuplicateFileName(fileName, index);
      if (isDuplicate) {
        // Set error message
        docGroup.get('errorMessage')?.setValue('File name already exists. Please choose a different name.');
        docGroup.get('uploadStatus')?.setValue('error');
        
        // Update documents array
        if (this.documents[index]) {
          this.documents[index].errorMessage = 'File name already exists. Please choose a different name.';
          this.documents[index].uploadStatus = 'error';
        }
        
        // Show error notification
        this.showError('Duplicate File Name', 'A file with this name already exists. Please rename the file.');
        
        // We'll still update the file and preview, but will not allow upload until renamed
        docGroup.patchValue({
          file: file,
          file_name: fileName,
          filePreview: true,
          fileIcon: this.getFileIconByExtension(extension),
          file_extension: extension
        });
        
        // Mark file_name as touched to show validation errors
        docGroup.get('file_name')?.markAsTouched();
        
        return;
      }
      
      // Update form control with the file details
      docGroup.patchValue({
        file: file,
        file_name: fileName,
        filePreview: true,
        fileIcon: this.getFileIconByExtension(extension), 
        file_extension: extension,
        fromServer: isExistingDocument,
        docId: isExistingDocument ? currentDoc.id : null,
        file_size: file.size,
        uploadStatus: 'pending',
        errorMessage: ''
      });

      // Update documents array
      if (this.documents[index]) {
        const localDoc: DocumentInfo = {
          ...this.documents[index],
          file_name: fileName,
          file_extension: extension,
          price: Number(docGroup.get('price')?.value) || 0,
          file: file,
          file_size: file.size,
          status: 'active',
          uploadStatus: 'pending',
          errorMessage: ''
        };
        this.documents[index] = localDoc;
      }
      
      // Immediately start uploading the file
      this.uploadFileOnly(index);
    }
  }

  // New method to upload just the file
  uploadFileOnly(index: number, isFromQueue: boolean = false): void {
    // Get the document and form control
    const doc = this.documents[index];
    const control = this.documentControls.at(index);
    if (!doc || !control || !doc.file) {
      console.error('Missing required data for file upload');
      if (isFromQueue) {
        this.processNextFileInQueue(); // Move to next file in queue
      }
      return;
    }

    // Update UI to show uploading state
    control.get('uploadStatus')?.setValue('uploading');
    control.get('uploadProgress')?.setValue(0);
    doc.uploadStatus = 'uploading';
    doc.uploadProgress = 0;

    // Increment counter for ongoing uploads
    this.pendingUploads++;
    this.uploadsInProgress = true;
    this.hasActiveUploads = true;

    // Create form data with just the file
    const formData = new FormData();
    formData.append('file', doc.file);

    console.log(`Starting upload for document: ${doc.file_name}`);
    
    // Call the first API to upload just the file
    // Use the new API endpoint
    this.addInsightStepsService.uploadKnowledgeDocument(this.defaultValues.knowledgeId, formData)
      .subscribe({
        next: (response) => {
          if (response && response.data && response.data.knowledge_document_id) {
            // Store the document ID returned by the API
            const docId = response.data.knowledge_document_id;
            console.log(`Upload successful - Document ID received: ${docId}`);
            
            // Make sure we're using the current document object
            const currentDoc = this.documents[index];
            if (!currentDoc) {
              console.error(`Document at index ${index} no longer exists`);
              if (isFromQueue) {
                this.processNextFileInQueue(); // Move to next file in queue
              }
              return;
            }
            
            // Update form control
            control.get('docId')?.setValue(docId);
            control.get('uploadStatus')?.setValue('success');
            
            // Update document object - ensure these changes actually persist
            currentDoc.id = docId;
            currentDoc.uploadStatus = 'success';
            // Force array update to ensure change detection
            this.documents = [...this.documents];
            
            console.log(`Document state after update: id=${currentDoc.id}, status=${currentDoc.uploadStatus}`);

            this.showSuccess('', 'File uploaded successfully');

            // Update parent with latest data
            this.updateParentModel({ documents: this.documents as IDocument[] }, this.validateDocuments());
            
            // Log all documents after update
            this.logDocumentStatus();
          } else {
            // Handle unexpected response format
            control.get('uploadStatus')?.setValue('error');
            control.get('errorMessage')?.setValue('Server response format is unexpected');
            doc.uploadStatus = 'error';
            doc.errorMessage = 'Server response format is unexpected';

            this.showError('Upload Error', 'Server returned an unexpected response format');
          }
        },
        error: (error) => {
          console.error('File upload error:', error);

          let errorMessage = 'Failed to upload file';
          if (error.error && error.error.message) {
            // Check for language mismatch error
            if (error.error.message.includes('language mismatch') || error.error.message.toLowerCase().includes('document language')) {
              errorMessage = 'Document language mismatch: All knowledge documents must use the same language. Please upload documents in a consistent language.';
            } else {
              errorMessage += `: ${error.error.message}`;
            }
          } else if (error.message) {
            // Also check the regular error message
            if (error.message.includes('language mismatch') || error.message.toLowerCase().includes('document language')) {
              errorMessage = 'Document language mismatch: All knowledge documents must use the same language. Please upload documents in a consistent language.';
            } else {
              errorMessage += `: ${error.message}`;
            }
          }

          control.get('uploadStatus')?.setValue('error');
          control.get('errorMessage')?.setValue(errorMessage);
          doc.uploadStatus = 'error';
          doc.errorMessage = errorMessage;
          
          // Immediately reset upload in progress indicators for language mismatch errors
          if (errorMessage.includes('language mismatch') || errorMessage.includes('Document language mismatch')) {
            this.pendingUploads = 0;
            this.uploadsInProgress = false;
            this.hasActiveUploads = false;
            
            // Clear any remaining files in the queue if this is a language error
            if (isFromQueue) {
              this.fileUploadQueue = [];
              this.isUploadInProgress = false;
            }
          }

          this.showError('Upload Error', errorMessage);
        },
        complete: () => {
          // Decrement the pending uploads counter
          this.pendingUploads--;
          if (this.pendingUploads === 0) {
            this.uploadsInProgress = false;
            this.hasActiveUploads = false;
          }
          
          // Process next file in queue if this was from the queue
          if (isFromQueue) {
            this.processNextFileInQueue();
          }
        }
      });
  }

  // Method to update document details (title, price) - This will be called by the parent component
  updateDocumentDetails(): Promise<boolean> {
    if (!this.defaultValues.knowledgeId || this.documents.length === 0) {
      return Promise.resolve(true); // No documents to update
    }

    // Prepare the documents data using IDs from form controls
    const documentsData = this.documentControls.controls.map((control, index) => {
      const docIdFromControl = control.get('docId')?.value;
      const doc = this.documents[index];
      
      // Use the ID from the form control (which should be updated during upload)
      return {
        id: docIdFromControl || doc.id,
        file_name: doc.file_name,
        price: doc.isCharity ? 0 : doc.price
      };
    });
    
    console.log('Sending document data for update:', documentsData);

    return new Promise((resolve, reject) => {
      this.addInsightStepsService.updateKnowledgeDocumentDetails(this.defaultValues.knowledgeId, documentsData)
        .subscribe({
          next: (response) => {
            console.log('Document details updated successfully:', response);
            this.showSuccess('', 'Document details updated successfully');
            resolve(true);
          },
          error: (error) => {
            console.error('Error updating document details:', error);
            let errorMessage = 'Failed to update document details';
            if (error.error && error.error.message) {
              errorMessage += `: ${error.error.message}`;
            } else if (error.message) {
              errorMessage += `: ${error.message}`;
            }
            this.showError('Update Error', errorMessage);
            reject(error);
          }
        });
    });
  }

  // Helper method to check for duplicate file names
  private isDuplicateFileName(fileName: string, currentIndex: number): boolean {
    if (!fileName) return false;
    
    return this.documentControls.controls.some(
      (control, index) => 
        index !== currentIndex && 
        control.get('file_name')?.value?.toLowerCase() === fileName.toLowerCase()
    );
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
          
          documentInfos.forEach((docInfo, index) => {
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
                    file_size: docInfo.file_size || 0,
                    uploadStatus: 'success', // Mark as already uploaded
                    isCharity: Number(docInfo.price) === 0,
                    originalFileName: docInfo.file_name || 'Untitled Document',
                    originalPrice: Number(docInfo.price) || 0,
                    table_of_content: docInfo.table_of_content || [] // Make sure to include table_of_content
                  };
                  
                  this.documents.push(serverDoc);
                  
                  // Create and update form control
                  const docGroup = this.createDocument();
                  docGroup.patchValue({
                    file_name: serverDoc.file_name,
                    price: serverDoc.price,
                    isCharity: serverDoc.isCharity,
                    filePreview: true,
                    fileIcon: this.getFileIconByExtension(docInfo.file_extension || ''),
                    file_extension: serverDoc.file_extension,
                    fromServer: true,
                    docId: serverDoc.id,
                    file_size: serverDoc.file_size,
                    docUrl: serverDoc.docUrl,
                    uploadStatus: 'success',
                  });
                  this.documentControls.push(docGroup);
                  
                  this.updateParentModel({ documents: this.documents as IDocument[] }, this.validateDocuments());
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
    this.documents = [];
    this.documentControls.clear();
    
    documents.forEach((doc, index) => {
      // Check if this is a server document
      const isFromServer = doc.fromServer === true;
      const isCharity = doc.isCharity || Number(doc.price) === 0;
      
      // Create clean DocumentInfo object
      const docInfo: DocumentInfo = {
        id: doc.id || 0,
        file_name: doc.file_name || '',
        file_extension: doc.file_extension || '',
        price: Number(doc.price) || 0,
        docUrl: doc.docUrl || '',
        fromServer: isFromServer,
        file: doc.file || null,
        status: doc.status || 'active',
        file_size: doc.file_size || 0,
        uploadStatus: isFromServer ? 'success' : 'pending',
        isCharity: isCharity,
        originalFileName: doc.file_name || '',
        originalPrice: Number(doc.price) || 0,
        table_of_content: doc.table_of_content || [] // Make sure to include table_of_content
      };
      
      this.documents.push(docInfo);
      
      const docGroup = this.createDocument();
      docGroup.patchValue({
        file_name: docInfo.file_name,
        price: Number(docInfo.price) || 0,
        isCharity: isCharity,
        file: docInfo.file,
        filePreview: true,
        fileIcon: this.getFileIconByExtension(docInfo.file_extension),
        file_extension: docInfo.file_extension,
        fromServer: docInfo.fromServer,
        docId: docInfo.id,
        file_size: docInfo.file_size,
        docUrl: docInfo.docUrl,
        uploadStatus: isFromServer ? 'success' : 'pending'
      });
      this.documentControls.push(docGroup);
    });

    // Update parent model after loading documents
    this.updateParentModel({ documents: this.documents as IDocument[] }, this.validateDocuments());
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
    // Don't allow proceeding if there are uploads in progress
    if (this.pendingUploads > 0 || this.hasActiveUploads) {
      console.log('Form invalid: uploads in progress');
      return false;
    }
    
    // Allow proceeding with no documents if needed
    if (!this.documents.length) {
      console.log('No documents available');
      return true; // Allow continuing with no documents
    }

    // Check for duplicate file names
    const fileNames = new Set<string>();
    
    for (let i = 0; i < this.documents.length; i++) {
      const doc = this.documents[i];
      const control = this.documentControls.at(i);
      
      // Check if file name exists and is not empty
      if (!doc.file_name?.trim()) {
        console.log(`Form invalid: document ${i} has no file name`);
        return false;
      }

      // Check for duplicate file names (case insensitive)
      const lowerFileName = doc.file_name.toLowerCase();
      if (fileNames.has(lowerFileName)) {
        console.log(`Form invalid: document ${i} has duplicate file name "${doc.file_name}"`);
        return false;
      }
      fileNames.add(lowerFileName);

      // Don't check control errors as we handle each field separately
      
      // Only check for upload errors, pending/uploading status is now allowed
      if (doc.uploadStatus === 'error') {
        console.log(`Form invalid: document ${i} has error status`);
        return false;
      }
    }

    // Form is valid - all documents either uploaded or in progress
    console.log('Documents validated successfully');
    return true;
  }

  private calculateTotalPrice(): void {
    this.totalPrice = this.documentControls.controls.reduce((sum, control) => {
      if (control.get('isCharity')?.value) {
        return sum; // Charity documents don't add to the price
      }
      const price = parseFloat(control.get('price')?.value) || 0;
      return sum + price;
    }, 0);
  }

  hasUploadsInProgress(): boolean {
    return this.pendingUploads > 0 || this.uploadsInProgress || this.hasActiveUploads;
  }

  // Method to check if any documents have upload errors
  hasUploadErrors(): boolean {
    return this.documents.some(doc => doc.uploadStatus === 'error');
  }

  // Method to get documents with pending uploads - with detailed logging
  getPendingDocuments(): DocumentInfo[] {
    console.log('Checking for pending documents...');
    
    const pendingDocs = this.documents.filter(doc => {
      const isPending = (doc.uploadStatus === 'pending' || doc.uploadStatus === 'uploading');
      const hasNoId = !doc.id;
      const result = isPending && hasNoId;
      
      console.log(`Document ${doc.file_name}: status=${doc.uploadStatus}, id=${doc.id}, isPending=${result}`);
      return result;
    });
    
    console.log(`Found ${pendingDocs.length} pending documents`);
    return pendingDocs;
  }

  // Call this method to manually validate and update the parent
  validateAndUpdateParent(): void {
    const isValid = this.validateDocuments();
    this.updateParentModel({ documents: this.documents as IDocument[] }, isValid);
  }

  // Add debugging method to help identify document status issues
  logDocumentStatus(): void {
    console.log('Current document statuses:');
    this.documents.forEach((doc, index) => {
      console.log(`Document ${index}: id=${doc.id}, name=${doc.file_name}, status=${doc.uploadStatus}`);
    });
  }

  processFile(file: File, index?: number): void {
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop() || '';
    const fileSize = file.size;
    
    // Create new document object
    const newDoc: DocumentInfo = {
      id: 0, // Will be set after upload
      file_name: fileName,
      file_extension: fileExtension,
      price: 0,
      file: file,
      uploadStatus: 'pending',
      file_size: fileSize,
      fromServer: false,
      status: 'active',
      isCharity: false,
      originalFileName: fileName,
      originalPrice: 0
    };
    
    let docIndex: number;
    
    // Add to documents array
    if (index !== undefined && index >= 0 && index < this.documents.length) {
      // Replace existing document at index
      this.documents[index] = newDoc;
      docIndex = index;
      // Update form control
      const control = this.documentControls.at(index);
      control.get('file_name')?.setValue(fileName);
      control.get('price')?.setValue(0);
      control.get('uploadStatus')?.setValue('pending');
    } else {
      // Add new document
      this.documents.push(newDoc);
      docIndex = this.documents.length - 1;
      // Add form control
      const control = this.fb.group({
        docId: [0],
        file_name: [fileName, [Validators.required]],
        price: [0, [Validators.required, Validators.min(0)]],
        isCharity: [false],
        uploadStatus: ['pending'],
        uploadProgress: [0],
        errorMessage: [''],
        file: [file],
        file_extension: [fileExtension],
        file_size: [fileSize]
      });
      this.documentControls.push(control);
    }
    
    // Create a new array reference to ensure change detection
    this.documents = [...this.documents];
    
    // Log document status after adding
    console.log(`Added document ${fileName} at index ${docIndex}, documents length: ${this.documents.length}`);
    this.logDocumentStatus();
    
    // Upload the file to the server immediately
    this.uploadFileOnly(docIndex);
    
    // Update parent model
    this.updateParentModel({ documents: this.documents as IDocument[] }, this.validateDocuments());
  }

  // Add a direct method to get document IDs from the API
  getUploadedDocumentIds(): void {
    // Log the current documents for debugging
    console.log('Current document state before fetching IDs:', this.documents);
    
    if (!this.defaultValues.knowledgeId) {
      console.error('No knowledge ID available');
      return;
    }
    
    this.addInsightStepsService.getListDocumentsInfo(this.defaultValues.knowledgeId)
      .subscribe({
        next: (response) => {
          if (response && response.data) {
            // Map server documents to local documents by file name
            console.log('Server documents:', response.data);
            
            // Update our local documents with server IDs
            this.documents.forEach((doc, index) => {
              // Find matching document from server by name
              const serverDoc = response.data.find(d => d.file_name === doc.file_name);
              if (serverDoc) {
                // Update document ID
                doc.id = serverDoc.id;
                console.log(`Updated document ID for ${doc.file_name} to ${doc.id}`);
              }
            });
            
            // Force array update
            this.documents = [...this.documents];
            console.log('Updated documents with server IDs:', this.documents);
          }
        },
        error: (error) => {
          console.error('Error fetching document IDs:', error);
        }
      });
  }

  // Handle price input to prevent leading zeros
  handlePriceInput(event: Event, index: number): void {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value;
    
    // Remove leading zeros
    if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
      // Get the numeric value without leading zeros
      const numericValue = parseInt(value, 10).toString();
      
      // Update the form control
      const priceControl = this.documentControls.at(index).get('price');
      if (priceControl) {
        priceControl.setValue(numericValue, { emitEvent: false });
      }
      
      // Set the input value directly to handle browser differences
      inputElement.value = numericValue;
    }
  }
}
