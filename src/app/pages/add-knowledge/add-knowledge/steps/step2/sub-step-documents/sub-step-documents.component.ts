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
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error';
  uploadProgress?: number;
  errorMessage?: string;
  isReadyToUpload?: boolean; // Tracks whether the document needs uploading
  needsFileUpload?: boolean; // True if file content has changed, false if only metadata changed
  originalFileName?: string; // To track if name has changed
  originalPrice?: number;    // To track if price has changed
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
  uploadsInProgress: boolean = false;
  hasActiveUploads = false;

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
      // Initial state - we'll wait for user to add documents
      // If you want to start with an empty form instead, uncomment the line below:
      // this.addEmptyDocument();
    }
    
    // Listen for form changes to detect metadata changes
    this.listenForFormChanges();
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
      collapsed: [false],
      errorMessage: [''],
      isReadyToUpload: [true] // Default to true for new documents
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

  // This is an alternative method to add an empty document if needed
  addEmptyDocument(): void {
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
      console.log(`Removing document at index ${index}:`, doc);
      
      // Get the document ID either from id or docId property
      const documentId = doc.id || (this.documentControls.at(index)?.get('docId')?.value);
      console.log(`Document ID: ${documentId}, Upload Status: ${doc.uploadStatus}`);
      
      // Check if document has been uploaded to server and has an ID
      if (documentId && doc.uploadStatus === 'success') {
        console.log(`Deleting document from server with ID: ${documentId}`);
        
        // Delete from server first
        this.addInsightStepsService.deleteKnowledgeDocument(documentId)
          .subscribe({
            next: (response) => {
              console.log(`Document deleted successfully from server:`, response);
              this.documents.splice(index, 1);
              this.documentControls.removeAt(index);
              this.updateParentModel({ documents: this.documents }, this.validateDocuments());
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
              this.updateParentModel({ documents: this.documents }, this.validateDocuments());
            }
          });
      } else {
        console.log(`Document not from server or not successfully uploaded, removing locally only`);
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

  triggerMultipleFileInput(): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt';
    
    fileInput.onchange = (event: any) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        this.handleMultipleFiles(files);
      }
    };
    
    fileInput.click();
  }

  handleMultipleFiles(files: FileList): void {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
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
        collapsed: false,
        errorMessage: '',
        isReadyToUpload: true
      });
      
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
        isReadyToUpload: true
      };
      
      this.documents.push(localDoc);
    }
    
    // Update parent model after adding all documents
    this.updateParentModel({ documents: this.documents }, this.validateDocuments());
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
      
      // Update form control WITH the file_name from the new file
      docGroup.patchValue({
        file: file,
        file_name: fileName, // Update the file name to match the new file
        filePreview: true,
        fileIcon: this.getFileIconByExtension(extension), 
        file_extension: extension,
        fromServer: isExistingDocument, // Keep fromServer status
        docId: isExistingDocument ? currentDoc.id : null,
        file_size: file.size,
        uploadStatus: 'pending', // Reset upload status
        errorMessage: '', // Clear any errors
        isReadyToUpload: true, // Mark for upload
        collapsed: false // Make sure it's not collapsed
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
          errorMessage: '',
          isReadyToUpload: true,
          // Mark that this document needs actual file upload (not just metadata update)
          needsFileUpload: true
        };
        this.documents[index] = localDoc;
      } else {
        const localDoc: DocumentInfo = {
          id: 0,
          file_name: fileName,
          file_extension: extension,
          price: Number(docGroup.get('price')?.value) || 0,
          file: file,
          fromServer: false,
          file_size: file.size,
          status: 'active',
          uploadStatus: 'pending',
          errorMessage: '',
          isReadyToUpload: true,
          needsFileUpload: true
        };
        this.documents.push(localDoc);
      }
      
      // Reset uploads in progress flags
      this.hasActiveUploads = false;
      this.uploadsInProgress = false;

      // Specifically handle transition from error state
      if (wasErrorState) {
        // Force error status removal throughout the component
        this.resetDocumentErrorState(index);
      }

      // Update parent model and form validity
      const isValid = this.validateDocuments();
      this.updateParentModel({ documents: this.documents }, isValid);
      
      // Ensure parent is notified of the change immediately
      setTimeout(() => {
        // Revalidate once more to ensure UI updates
        const isValidOnTimeout = this.validateDocuments();
        this.updateParentModel({ documents: this.documents }, isValidOnTimeout);
      }, 0);
    }
  }

  // New method to ensure error state is completely cleared when a file is replaced
  private resetDocumentErrorState(index: number): void {
    // Update the document in the documents array
    if (this.documents[index]) {
      this.documents[index].uploadStatus = 'pending';
      this.documents[index].errorMessage = '';
    }
    
    // Update the form control
    const control = this.documentControls.at(index);
    if (control) {
      control.get('uploadStatus')?.setValue('pending');
      control.get('errorMessage')?.setValue('');
      control.get('isReadyToUpload')?.setValue(true);
    }
    
    // Update error flags to ensure they're not preventing form validation
    this.updateActiveUploadsState();
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
                    isReadyToUpload: false,  // No need to re-upload
                    needsFileUpload: false,  // No file content changes
                    // Store original values for change tracking
                    originalFileName: docInfo.file_name || 'Untitled Document',
                    originalPrice: Number(docInfo.price) || 0
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
                    docUrl: serverDoc.docUrl,
                    uploadStatus: 'success',
                    isReadyToUpload: false,
                    collapsed: true // Collapsed view for server documents
                  });
                  this.documentControls.push(docGroup);
                  
                  // Store original values
                  this.storeOriginalValues(serverDoc, this.documents.length - 1);
                  
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
    this.documents = [];
    this.documentControls.clear();
    
    documents.forEach((doc, index) => {
      // Check if this is a server document
      const isFromServer = doc.fromServer === true;
      
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
        isReadyToUpload: !isFromServer, // Only new docs need uploading
        needsFileUpload: !isFromServer,  // New docs need file uploads
        originalFileName: doc.file_name || '',
        originalPrice: Number(doc.price) || 0
      };
      
      this.documents.push(docInfo);
      
      const docGroup = this.createDocument();
      docGroup.patchValue({
        file_name: docInfo.file_name,
        price: Number(docInfo.price) || 0,
        file: docInfo.file,
        filePreview: true,
        fileIcon: this.getFileIconByExtension(docInfo.file_extension),
        file_extension: docInfo.file_extension,
        fromServer: docInfo.fromServer,
        docId: docInfo.id,
        file_size: docInfo.file_size,
        docUrl: docInfo.docUrl,
        uploadStatus: isFromServer ? 'success' : 'pending',
        isReadyToUpload: !isFromServer,
        collapsed: isFromServer // Collapse server documents by default
      });
      this.documentControls.push(docGroup);
      
      // Store original values
      this.storeOriginalValues(docInfo, index);
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
    // If uploads are in progress, the form is invalid
    if (this.hasActiveUploads || this.uploadsInProgress) {
      console.log('Form invalid: uploads in progress');
      return false;
    }
    
    if (!this.documents.length) {
      console.log('Form invalid: no documents');
      return false;
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

      // Check that all documents have been successfully uploaded
      if (doc.uploadStatus !== 'success') {
        console.log(`Form invalid: document ${i} has not been successfully uploaded (status: ${doc.uploadStatus})`);
        return false;
      }

      // Check if the form control has any validation errors
      if (control.get('file_name')?.errors) {
        console.log(`Form invalid: document ${i} has validation errors`, control.get('file_name')?.errors);
        return false;
      }
      
      // Check if there are any error-state documents
      if (doc.uploadStatus === 'error') {
        console.log(`Form invalid: document ${i} has error status`);
        return false;
      }
    }

    // Form is valid
    console.log('Documents validated successfully');
    return true;
  }

  private calculateTotalPrice(): void {
    this.totalPrice = this.documentControls.controls.reduce((sum, control) => {
      const price = parseFloat(control.get('price')?.value) || 0;
      return sum + price;
    }, 0);
  }

  // Methods to update upload status and progress
  updateDocumentUploadStatus(index: number, status: 'pending' | 'uploading' | 'success' | 'error', errorMsg?: string): void {
    if (index >= 0 && index < this.documentControls.length) {
      // Update form control
      const control = this.documentControls.at(index);
      control.get('uploadStatus')?.setValue(status);
      
      // Set error message if provided
      if (errorMsg && status === 'error') {
        control.get('errorMessage')?.setValue(errorMsg);
      }
      
      // Update documents array
      if (this.documents[index]) {
        this.documents[index].uploadStatus = status;
        if (errorMsg && status === 'error') {
          this.documents[index].errorMessage = errorMsg;
        }
      }
      
      // Update hasActiveUploads based on all documents
      this.updateActiveUploadsState();
    }
  }

  updateDocumentUploadProgress(index: number, progress: number): void {
    if (index >= 0 && index < this.documentControls.length) {
      // Ensure progress is between 0 and 100
      progress = Math.min(100, Math.max(0, progress));
      
      // Update form control
      this.documentControls.at(index).get('uploadProgress')?.setValue(progress);
      
      // Update documents array
      if (this.documents[index]) {
        this.documents[index].uploadProgress = progress;
      }
    }
  }

  // Reset all upload statuses to pending
  resetAllUploadStatuses(): void {
    for (let i = 0; i < this.documentControls.length; i++) {
      this.updateDocumentUploadStatus(i, 'pending');
      this.updateDocumentUploadProgress(i, 0);
      // Reset collapsed state
      this.documentControls.at(i).get('collapsed')?.setValue(false);
    }
  }

  // Method to check if any document is currently uploading
  hasUploadsInProgress(): boolean {
    return this.hasActiveUploads || this.uploadsInProgress;
  }
  
  // Method to be called from parent component when starting uploads
  startDocumentUpload(documentIndex: number): void {
    this.updateDocumentUploadStatus(documentIndex, 'uploading');
    this.updateDocumentUploadProgress(documentIndex, 0);
    
    // Set uploads in progress flags
    this.hasActiveUploads = true;
    this.uploadsInProgress = true;
    
    // Force form to be invalid during upload
    this.updateParentModel({ documents: this.documents }, false);
  }
  
  // Method to be called from parent component to update upload progress
  updateUploadProgress(documentIndex: number, progress: number): void {
    this.updateDocumentUploadProgress(documentIndex, progress);
  }
  
  // Method to be called from parent component when upload completes
  completeDocumentUpload(documentIndex: number, success: boolean): void {
    if (success) {
      this.updateDocumentUploadStatus(documentIndex, 'success');
      this.updateDocumentUploadProgress(documentIndex, 100);
      
      // Collapse successful uploads and mark as not needing upload
      if (documentIndex >= 0 && documentIndex < this.documentControls.length) {
        const control = this.documentControls.at(documentIndex);
        control.get('collapsed')?.setValue(true);
        control.get('isReadyToUpload')?.setValue(false);
      }
      
      if (this.documents[documentIndex]) {
        this.documents[documentIndex].isReadyToUpload = false;
      }
    } else {
      // If error, make sure the document is expanded
      if (documentIndex >= 0 && documentIndex < this.documentControls.length) {
        this.documentControls.at(documentIndex).get('collapsed')?.setValue(false);
      }
      
      // Leave isReadyToUpload as true for failed uploads
      this.updateDocumentUploadStatus(documentIndex, 'error');
    }
    
    // Check if there are still active uploads
    this.updateActiveUploadsState();
  }

  // Method to prepare for uploading all documents
  prepareForUpload(): void {
    // Only reset statuses for documents that are pending or ready to upload
    // Don't reset documents with "success" status unless they've been marked for upload
    for (let i = 0; i < this.documentControls.length; i++) {
      const control = this.documentControls.at(i);
      const isReadyToUpload = control.get('isReadyToUpload')?.value === true;
      const currentStatus = control.get('uploadStatus')?.value;
      
      // Only reset documents that are:
      // 1. Pending or
      // 2. Had errors but were fixed (isReadyToUpload === true) or
      // 3. Explicitly marked for upload
      if (currentStatus === 'pending' || 
          (currentStatus === 'error' && isReadyToUpload) || 
          isReadyToUpload) {
        
        this.updateDocumentUploadStatus(i, 'pending');
        this.updateDocumentUploadProgress(i, 0);
      }
    }
    
    // Update active uploads state
    this.updateActiveUploadsState();
    
    // Validate and notify parent
    const isValid = !this.hasUploadsInProgress();
    this.updateParentModel({ documents: this.documents }, isValid);
  }

  // Toggle collapsed state for a document
  toggleDocumentCollapse(index: number): void {
    
    if (index >= 0 && index < this.documentControls.length) {
      const docControl = this.documentControls.at(index);
      if(docControl.get('uploadStatus')?.value ==='uploading'){
       return;
      }
      const currentState = docControl.get('collapsed')?.value;
      docControl.get('collapsed')?.setValue(!currentState);
    }
  }

  // Update the active uploads state based on document statuses
  private updateActiveUploadsState(): void {
    const hasUploading = this.documentControls.controls.some(
      control => control.get('uploadStatus')?.value === 'uploading'
    );
    
    // Update the uploadsInProgress state
    this.uploadsInProgress = hasUploading;
    this.hasActiveUploads = hasUploading;
    
    // Check if all documents are valid
    const isFormValid = this.validateDocuments();
    
    // Always update parent model with current validity
    this.updateParentModel({ documents: this.documents }, isFormValid);
  }

  // Method for parent component to handle document upload failures with error messages
  failDocumentUpload(documentIndex: number, errorMessage: string): void {
    this.updateDocumentUploadStatus(documentIndex, 'error', errorMessage);
    
    // Mark document as ready to upload again
    if (documentIndex >= 0 && documentIndex < this.documentControls.length) {
      const control = this.documentControls.at(documentIndex);
      control.get('isReadyToUpload')?.setValue(true);
      control.get('collapsed')?.setValue(false); // Make sure it's expanded to show the error
    }
    
    if (this.documents[documentIndex]) {
      this.documents[documentIndex].isReadyToUpload = true;
    }
    
    // Check if there are still active uploads
    this.updateActiveUploadsState();
  }

  // Get only documents that need uploading (new, changed, or failed)
  getDocumentsToUpload(): { document: any, index: number }[] {
    return this.documents
      .map((doc, index) => ({ document: doc, index }))
      .filter(item => {
        if (!item.document) return false;
        
        // Get form control for this document
        const control = this.documentControls.at(item.index);
        if (!control) return false;
        
        const uploadStatus = control.get('uploadStatus')?.value;
        const needsFileUpload = item.document.needsFileUpload === true;
        
        // Include document if:
        // 1. It's a brand new document (pending status with a file)
        // 2. It has error status and a file
        // 3. It's marked for re-upload because the file content changed
        return (uploadStatus === 'pending' && item.document.file) || 
               (uploadStatus === 'error' && item.document.file) ||
               needsFileUpload;
      });
  }

  // Get documents that need only metadata updates (not file re-uploads)
  getDocumentsForMetadataUpdate(): { document: any, index: number }[] {
    return this.documents
      .map((doc, index) => ({ document: doc, index }))
      .filter(item => {
        if (!item.document || !item.document.id) return false;
        
        const doc = item.document;
        const control = this.documentControls.at(item.index);
        if (!control) return false;
        
        // Only include successfully uploaded documents from server
        if (doc.fromServer !== true || doc.uploadStatus !== 'success') return false;
        
        // Check if metadata changed
        const currentName = control.get('file_name')?.value;
        const currentPrice = control.get('isCharity')?.value ? 0 : Number(control.get('price')?.value);
        
        // Include if name or price changed but file content didn't
        return (doc.originalFileName !== currentName || doc.originalPrice !== currentPrice) && 
               !doc.needsFileUpload;
      });
  }

  // Track metadata changes without marking for re-upload
  trackMetadataChange(index: number): void {
    const control = this.documentControls.at(index);
    const doc = this.documents[index];
    
    if (control && doc) {
      // Get current values
      const currentName = control.get('file_name')?.value;
      const currentPrice = control.get('isCharity')?.value ? 0 : Number(control.get('price')?.value);
      
      // If this is a server document and metadata changed, mark for metadata update
      if (doc.fromServer && (doc.originalFileName !== currentName || doc.originalPrice !== currentPrice)) {
        doc.isReadyToUpload = true;
        
        // But don't mark for full file re-upload
        doc.needsFileUpload = false;
      }
    }
  }
  
  // Method to store original values when loading documents from server
  private storeOriginalValues(doc: DocumentInfo, index: number): void {
    if (doc) {
      // Store original values to track changes
      doc.originalFileName = doc.file_name;
      doc.originalPrice = doc.price;
      doc.needsFileUpload = false;
      
      // Update the document in the array
      this.documents[index] = doc;
    }
  }

  // Set up listeners for form control changes to detect metadata changes
  private listenForFormChanges(): void {
    this.documentsForm.valueChanges.subscribe(() => {
      // Check each document for metadata changes
      this.documentControls.controls.forEach((control, index) => {
        if (index < this.documents.length) {
          this.trackMetadataChange(index);
        }
      });
    });
  }

  // Check if there are any documents with errors
  hasUploadErrors(): boolean {
    // First check the documents array
    const hasDocsWithErrors = this.documents.some(doc => doc && doc.uploadStatus === 'error');
    
    // Then check the form controls as well to be thorough
    const hasControlsWithErrors = this.documentControls?.controls.some(
      control => control.get('uploadStatus')?.value === 'error'
    );
    
    const hasErrors = hasDocsWithErrors || hasControlsWithErrors;
    
    // Log the result to help with debugging
    if (hasErrors) {
      console.log('Upload errors detected in documents');
    }
    
    return hasErrors;
  }

  // New method to handle individual document uploads
  uploadSingleDocument(index: number): void {
    // Validate that we have a valid document
    if (index < 0 || index >= this.documentControls.length) {
      console.error('Invalid document index');
      return;
    }

    const docControl = this.documentControls.at(index);
    const doc = this.documents[index];
    
    if (!doc || !docControl) {
      console.error('Document not found');
      return;
    }
    
    // Check if we have the required fields
    const fileName = docControl.get('file_name')?.value;
    const file = docControl.get('file')?.value;
    
    if (!fileName || !file) {
      this.showError('', 'File name and file are required');
      return;
    }
    
    // Update status to uploading
    this.startDocumentUpload(index);
    
    // Prepare the document request
    const documentRequest: any = {
      file_name: fileName,
      price: (docControl.get('isCharity')?.value ? 0 : docControl.get('price')?.value || 0).toString(),
      status: 'active',
      file: file
    };
    
    // Set up progress tracking interval
    const progressInterval = setInterval(() => {
      const currentProgress = Math.min(90, (doc.uploadProgress || 0) + 10);
      this.updateDocumentUploadProgress(index, currentProgress);
    }, 500);
    
    // Make API call to upload document
    this.addInsightStepsService
      .step3AddKnowledgeDocument(
        doc.fromServer ? doc.id : this.defaultValues?.knowledgeId, 
        documentRequest, 
        doc.fromServer // isUpdate flag
      )
      .subscribe({
        next: (response) => {
          console.log('Document uploaded successfully', response);
          clearInterval(progressInterval);
          
          // Update document with server response data
          if (response?.data) {
            // Extract the document ID from the response
            // API returns { data: { knowledge_document_id: number } }
            const documentId = response.data.knowledge_document_id;
            console.log('Document ID from server:', documentId);
            
            if (!documentId) {
              console.error('No document ID found in response:', response);
              this.failDocumentUpload(index, 'Failed to get document ID from server');
              return;
            }
            
            // Update document with server data
            doc.id = documentId;
            doc.fromServer = true;
            doc.needsFileUpload = false;
            doc.originalFileName = fileName;
            doc.originalPrice = Number(documentRequest.price);
            doc.uploadStatus = 'success'; // Ensure upload status is set to success
            
            // Update form control
            docControl.patchValue({
              docId: documentId,
              fromServer: true,
              isReadyToUpload: false,
              uploadStatus: 'success' // Ensure form control upload status is set to success
            });
            
            // Log the updated document
            console.log(`Document updated with ID ${documentId}:`, doc);
          }
          
          // Mark upload as complete
          this.completeDocumentUpload(index, true);
          
          // Show success notification
          this.showSuccess('', `File "${fileName}" uploaded successfully`);
        },
        error: (error) => {
          clearInterval(progressInterval);
          
          // Extract error message
          let errorMessage = 'Upload failed';
          if (error.status === 413) {
            errorMessage = 'File too large';
          } else if (error.error && error.error.message) {
            errorMessage = error.error.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          console.error(`Document upload error: ${errorMessage}`, error);
          
          // Mark upload as failed
          this.failDocumentUpload(index, errorMessage);
          
          // Show error notification
          this.showError('Upload Error', `File "${fileName}" failed to upload: ${errorMessage}`);
        }
      });
  }

  // Method to get documents that still need to be uploaded (pending status)
  getPendingDocuments(): { document: any, index: number }[] {
    return this.documents
      .map((doc, index) => ({ document: doc, index }))
      .filter(item => {
        if (!item.document) return false;
        
        // Get form control for this document
        const control = this.documentControls.at(item.index);
        if (!control) return false;
        
        const uploadStatus = control.get('uploadStatus')?.value;
        
        // Include document if it has pending status and a file
        return uploadStatus === 'pending' && item.document.file;
      });
  }
}
