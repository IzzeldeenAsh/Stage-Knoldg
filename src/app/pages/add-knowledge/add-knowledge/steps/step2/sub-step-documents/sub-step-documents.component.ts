import { Component, Injector, Input, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { BaseComponent } from 'src/app/modules/base.component';
import { ICreateKnowldege, IDocument } from '../../../create-account.helper';
import { trigger, transition, style, animate } from '@angular/animations';
import { AddInsightStepsService } from 'src/app/_fake/services/add-insight-steps/add-insight-steps.service';
import { KnowledgeService } from 'src/app/_fake/services/knowledge/knowledge.service';
import { Subscription } from 'rxjs';
import { HorizontalComponent } from '../../../horizontal/horizontal.component';

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
  language?: string; // Language of the document
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
  @ViewChild('multiUploadInput') multiUploadInput!: ElementRef<HTMLInputElement>;
  @Input('updateParentModel') updateParentModel: (
    part: Partial<ICreateKnowldege>,
    isFormValid: boolean
  ) => void;

  @Input('defaultValues') defaultValues: ICreateKnowldege;
  @Input() parentComponent: HorizontalComponent;
  documentsForm: FormGroup;
  totalPrice: number = 0;
  documents: DocumentInfo[] = [];
  // Include both extensions and MIME types to maximize compatibility on iOS/iPadOS
  fileAcceptAttr: string =
    '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,' +
    'application/pdf,application/msword,' +
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document,' +
    'application/vnd.ms-powerpoint,' +
    'application/vnd.openxmlformats-officedocument.presentationml.presentation,' +
    'application/vnd.ms-excel,' +
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,' +
    'text/plain';
  uploadsInProgress: boolean = false;
  hasActiveUploads = false;
  pendingUploads: number = 0;
  
  // File size limit constant (100MB in bytes)
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024;
  
  // Track active upload subscriptions
  private activeUploadSubscriptions: { [index: number]: Subscription } = {};
  
  // Language mismatch dialog properties
  showLanguageMismatchDialog = false;
  languageMismatchTitle = '';
  languageMismatchMessage = '';
  languageMismatchDocuments: string[] = [];
  private languageMismatchResolver: ((value: boolean) => void) | null = null;
  // Track last shown mismatch to avoid re-showing after user edits titles
  private lastLanguageMismatchDocs: Array<{ id: string | number; name: string }> = [];

  constructor(
    injector: Injector,
    private fb: FormBuilder,
    private addInsightStepsService: AddInsightStepsService,
    private knowledgeService: KnowledgeService,
    private cdr: ChangeDetectorRef
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
          const isCharity = control.get('isCharity')?.value || false;
          // PRESERVE existing properties when updating from form
          this.documents[index] = {
            ...this.documents[index],
            file_name: control.get('file_name')?.value,
            price: price,
            isCharity: isCharity
            // Don't overwrite id, uploadStatus, language, etc.
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
    
    // Track previous validation state to avoid excessive logging
    let previousValidState: boolean | null = null;
    
    // Set up a timer to periodically check document status and update parent model
    // This ensures the parent component always has the latest validation state
    setInterval(() => {
      if (this.documents.length > 0) {
        const isValid = this.validateDocuments(false); // Pass false to suppress logging
        
        // Only update parent model if validation state has changed
        if (previousValidState === null || previousValidState !== isValid) {
          this.updateParentModel({ documents: this.documents as IDocument[] }, isValid);
          previousValidState = isValid;
        }
      }
    }, 1000); // Check every second
  }

  get documentControls(): FormArray {
    return this.documentsForm.get('documents') as FormArray;
  }

  private createDocument(): FormGroup {
    const group = this.fb.group({
      file_name: ['', [Validators.required]],
      price: [0, [Validators.required, Validators.min(10)]],
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
        priceControl?.clearValidators();
        priceControl?.disable();
        priceControl?.updateValueAndValidity({ emitEvent: false });
      } else {
        priceControl?.enable();
        priceControl?.setValidators([Validators.required, Validators.min(10)]);
        priceControl?.updateValueAndValidity({ emitEvent: false });
      }
    });
  
    return group;
  }

  addDocument(): void {
    // Prefer the persistent template input for iOS reliability (synchronous user gesture)
    if (this.multiUploadInput && this.multiUploadInput.nativeElement) {
      const inputEl = this.multiUploadInput.nativeElement;
      // Reset value to allow re-selecting the same file(s)
      inputEl.value = '';
      inputEl.click();
      return;
    }
    // Fallback to dynamic creation if template input not available
    this.triggerMultipleFileInput();
  }

  removeDocument(index: number): void {
    const doc = this.documents[index];
    if (doc) {
      
      // Check if there's an active upload for this document
      if ((doc.uploadStatus === 'uploading' || doc.uploadStatus === 'pending') && this.activeUploadSubscriptions[index]) {
        // Cancel the upload subscription
        this.activeUploadSubscriptions[index].unsubscribe();
        delete this.activeUploadSubscriptions[index];
        
        // Decrement the pending uploads counter
        this.pendingUploads = Math.max(0, this.pendingUploads - 1);
        
        // Reset upload in progress flag to allow new uploads
        this.isUploadInProgress = false;
        
        // Force update of upload status indicators
        this.updateUploadStatusIndicators();
        
        // Remove document locally without server call
        this.documents.splice(index, 1);
        this.documentControls.removeAt(index);
        this.calculateTotalPrice();
        this.updateParentModel({ documents: this.documents as IDocument[] }, this.validateDocuments());
        
        // Check if this was the last document and handle knowledge deletion
        this.checkAndHandleEmptyDocuments();
        
        this.showInfo('', 'Upload cancelled and document removed');
        return;
      }
      
      // Get the document ID either from id or docId property
      const documentId = doc.id || (this.documentControls.at(index)?.get('docId')?.value);
      
      // Check if document has an ID (regardless of fromServer flag)
      // Since we're now auto-uploading files, they all get IDs
      if (documentId) {
        
        // Set a local flag to track this specific deletion
        const deletionIndex = index;
        const isDeletionInProgress = true;
        
        // Delete from server first
        this.addInsightStepsService.deleteKnowledgeDocument(documentId)
          .subscribe({
            next: (response) => {
              this.documents.splice(index, 1);
              this.documentControls.removeAt(index);
              this.calculateTotalPrice();
              this.updateParentModel({ documents: this.documents as IDocument[] }, this.validateDocuments());
              this.showSuccess('', 'Document deleted successfully');
              
              // Make sure all status indicators are updated
              this.updateUploadStatusIndicators();
              
              // Check if this was the last document and handle knowledge deletion
              this.checkAndHandleEmptyDocuments();
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
              
              // Force reset of all upload status indicators
              this.pendingUploads = 0;
              this.uploadsInProgress = false;
              this.hasActiveUploads = false;
              this.isUploadInProgress = false; // Reset upload in progress flag
              this.updateUploadStatusIndicators();
              
              // Check if this was the last document and handle knowledge deletion
              this.checkAndHandleEmptyDocuments();
            }
          });
      } else {
        // Local document, just remove from array
        this.documents.splice(index, 1);
        this.documentControls.removeAt(index);
        this.calculateTotalPrice();
        this.updateParentModel({ documents: this.documents as IDocument[] }, this.validateDocuments());
        
        // Make sure all status indicators are updated
        this.updateUploadStatusIndicators();
        
        // Check if this was the last document and handle knowledge deletion
        this.checkAndHandleEmptyDocuments();
      }
    }
  }

  triggerFileInput(index: number): void {
    // Use a longer timeout for Safari browsers
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    setTimeout(() => {
      document.getElementById('fileInput' + index)?.click();
    }, isSafari ? 100 : 0);
  }

  triggerMultipleFileInput(): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt';
    // Do NOT set the 'capture' attribute (iOS could force camera UI)
    // iOS Safari requires the input to be in the DOM for change to reliably fire
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    let handled = false;
    const handleFiles = () => {
      if (handled) {
        return;
      }
      handled = true;
      const files = (fileInput.files as FileList) || ({} as FileList);
      if (files && files.length > 0) {
        // Ensure Angular picks up changes even if this listener fires outside its zone
        this.handleMultipleFiles(files);
        this.cdr.detectChanges();
      }
      // Cleanup the temporary input
      if (fileInput.parentNode) {
        fileInput.parentNode.removeChild(fileInput);
      }
    };

    // Some Safari/iOS versions fire 'input' instead of 'change' for file inputs
    fileInput.addEventListener('change', handleFiles, { once: true });
    fileInput.addEventListener('input', handleFiles, { once: true });

    // Use a longer timeout for Safari to ensure the click event is properly processed
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    setTimeout(() => {
      fileInput.click();
    }, isSafari ? 150 : 0);
  }

  // Queue to store files for sequential upload
  private fileUploadQueue: File[] = [];
  private isUploadInProgress = false;
  
  // Handler for the persistent template input (ensures iOS/iPadOS closes picker)
  public onMultipleFilesSelected(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const files = inputEl.files;
    if (files && files.length > 0) {
      this.handleMultipleFiles(files);
      this.cdr.detectChanges();
    }
    // Reset input so selecting the same files again still triggers change
    inputEl.value = '';
  }
  
  // Flag to track if knowledge type has been created
  private knowledgeTypeCreated = false;
  
  handleMultipleFiles(files: FileList): void {
    // Convert FileList to array and validate file sizes
    const filesArray = Array.from(files);
    const validFiles: File[] = [];
    const invalidFiles: File[] = [];
    
    // Check each file size
    filesArray.forEach(file => {
      if (file.size > this.MAX_FILE_SIZE) {
        invalidFiles.push(file);
      } else {
        validFiles.push(file);
      }
    });
    
    // Show error message for files that exceed size limit
    if (invalidFiles.length > 0) {
      const fileNames = invalidFiles.map(f => f.name).join(', ');
      const errorMessage = this.lang === 'ar' 
        ? `الملفات التالية تتجاوز الحد الأقصى للحجم (100 ميجابايت): ${fileNames}`
        : `The following files exceed the maximum size limit (100MB): ${fileNames}`;
      
      this.showError(
        this.lang === 'ar' ? 'حجم الملف كبير جداً' : 'File Size Too Large',
        errorMessage
      );
    }
    
    // Only add valid, unique files to upload queue
    if (validFiles.length > 0) {
      // Build a set of existing file keys already queued or present in documents
      const existingKeys = new Set<string>();
      const toKey = (f: File) => `${f.name}|${f.size}|${f.lastModified}`;
      
      this.fileUploadQueue.forEach(f => existingKeys.add(toKey(f)));
      this.documents.forEach(d => {
        if (d.file) {
          existingKeys.add(toKey(d.file));
        }
      });
      
      const seen = new Set<string>();
      const uniqueValidFiles: File[] = [];
      validFiles.forEach(f => {
        const key = toKey(f);
        if (!seen.has(key) && !existingKeys.has(key)) {
          seen.add(key);
          uniqueValidFiles.push(f);
        }
      });
      
      if (uniqueValidFiles.length > 0) {
        this.fileUploadQueue.push(...uniqueValidFiles);
      }
      
      // Start sequential upload process if not already in progress
      if (!this.isUploadInProgress) {
        this.processNextFileInQueue();
      }
    }
  }
  
  // Reset knowledge type creation flag when switching to a new knowledge
  resetKnowledgeTypeCreationFlag(): void {
    this.knowledgeTypeCreated = false;
  }
  
  private processNextFileInQueue(): void {
    if (this.fileUploadQueue.length === 0) {
      this.isUploadInProgress = false;
      return;
    }
    
    this.isUploadInProgress = true;
    const file = this.fileUploadQueue.shift();
    
    if (!file) {
      this.isUploadInProgress = false;
      return;
    }
    
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
      table_of_content: [], // Initialize empty table_of_content
      language: undefined // Will be set after upload
    };
    
    this.documents.push(localDoc);
    
    // Start uploading the file
    this.uploadFileOnly(docIndex, true);
  }

  onFileSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      // Check file size before processing
      if (file.size > this.MAX_FILE_SIZE) {
        const errorMessage = this.lang === 'ar' 
          ? `الملف "${file.name}" يتجاوز الحد الأقصى للحجم (100 ميجابايت)`
          : `File "${file.name}" exceeds the maximum size limit (100MB)`;
        
        this.showError(
          this.lang === 'ar' ? 'حجم الملف كبير جداً' : 'File Size Too Large',
          errorMessage
        );
        
        // Reset the file input
        event.target.value = '';
        return;
      }
      
      const extension = this.getFileExtension(file.name);
      const fileName = file.name.replace(`.${extension}`, ''); // Extract file name without extension
      const docGroup = this.documentControls.at(index);
      
      // Get current document info
      const currentDoc = this.documents[index];
      const isExistingDocument = currentDoc && currentDoc.fromServer;
      const wasErrorState = currentDoc && currentDoc.uploadStatus === 'error';
      
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
          errorMessage: '',
          language: undefined // Will be set after upload
        };
        this.documents[index] = localDoc;
      }
      
      // Immediately start uploading the file - now the method is async
      this.uploadFileOnly(index).catch(error => {
        console.error('Error during file upload:', error);
      });
    }
  }

  // New method to upload just the file
  async uploadFileOnly(index: number, isFromQueue: boolean = false): Promise<void> {
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
    
    // Check if we need to create the knowledge type first
    let knowledgeId = this.defaultValues.knowledgeId;
    if (!knowledgeId && !this.knowledgeTypeCreated && this.parentComponent) {
      try {
        this.showInfo('', 'Creating knowledge...');
        
        // Call the parent component's method to create knowledge type
        knowledgeId = await this.parentComponent.createKnowledgeType();
        this.knowledgeTypeCreated = true;
      } catch (error) {
        console.error('Error creating knowledge type:', error);
        this.showError('', 'Failed to create knowledge. Please try again.');
        
        // Update document status to error
        control.get('uploadStatus')?.setValue('error');
        control.get('errorMessage')?.setValue('Failed to create knowledge type');
        doc.uploadStatus = 'error';
        doc.errorMessage = 'Failed to create knowledge type';
        
        // Decrement the pending uploads counter
        this.pendingUploads = Math.max(0, this.pendingUploads - 1);
        this.updateUploadStatusIndicators();
        
        if (isFromQueue) {
          this.processNextFileInQueue(); // Move to next file in queue
        }
        return;
      }
    }
    
    // Call the first API to upload just the file with progress tracking
    // Use the new API endpoint and the knowledgeId we just obtained if necessary
    const subscription = this.addInsightStepsService.uploadKnowledgeDocumentWithProgress(knowledgeId || this.defaultValues.knowledgeId, formData)
      .subscribe({
        next: (event) => {
          if (event.type === 'progress') {
            // Update progress
            control.get('uploadProgress')?.setValue(event.progress);
            doc.uploadProgress = event.progress;
          } else if (event.type === 'response' && event.response && event.response.data && event.response.data.knowledge_document_id) {
            // Store the document ID and language returned by the API
            const docId = event.response.data.knowledge_document_id;
            const language = (event.response.data as any).language; // Type assertion for language property

            // Make sure we're using the current document object
            const currentDoc = this.documents[index];
            if (!currentDoc) {
              if (isFromQueue) {
                this.processNextFileInQueue(); // Move to next file in queue
              }
              return;
            }

            // Update form control
            control.get('docId')?.setValue(docId);
            control.get('uploadStatus')?.setValue('success');
            control.get('uploadProgress')?.setValue(100);

            // Update document object - ensure these changes actually persist
            currentDoc.id = docId;
            currentDoc.uploadStatus = 'success';
            currentDoc.uploadProgress = 100;
            currentDoc.language = language; // Store the language

            // Update the specific array element to ensure persistence
            this.documents[index] = { ...currentDoc };

            // Force array update to ensure change detection
            this.documents = [...this.documents];

            // Force change detection to update the template
            this.cdr.detectChanges();

            // Debug the language display conditions
            setTimeout(() => {
              this.checkLanguageDisplayConditions();
            }, 100);
           if(this.lang=='ar'){
            this.showSuccess('', 'تم رفع الملف بنجاح');
           }else{
            this.showSuccess('', 'File uploaded successfully');
           }

            // Update parent with latest data
            this.updateParentModel({ documents: this.documents as IDocument[] }, this.validateDocuments());
            
            // Update upload status indicators
            this.updateUploadStatusIndicators();
            
            // Log all documents after update
            this.logDocumentStatus();
          } else if (event.type === 'response') {
            // Handle unexpected response format
            control.get('uploadStatus')?.setValue('error');
            control.get('errorMessage')?.setValue('Server response format is unexpected');
            doc.uploadStatus = 'error';
            doc.errorMessage = 'Server response format is unexpected';

            this.showError('Upload Error', 'Server returned an unexpected response format');
          }
          // Ignore 'other' type events
        },
        error: (error) => {
          console.error('File upload error:', error);

          // Prefer backend "errors" details over generic message
          let errorMessage = 'Failed to upload file';
          let detectedLanguage: string | null = null;
          const backendType = error?.error?.type;
          const backendErrors = error?.error?.errors;
          const backendMessage = error?.error?.message;

          // Show ONLY the backend-provided message when available
          if (backendMessage && typeof backendMessage === 'string') {
            errorMessage = backendMessage;
          } else if (error?.message) {
            errorMessage = error.message;
          }

          // Optionally persist detected language (without altering the shown message)
          if (backendErrors && backendErrors.language) {
            const langMsgRaw = Array.isArray(backendErrors.language) ? backendErrors.language[0] : backendErrors.language;
            if (typeof langMsgRaw === 'string') {
              detectedLanguage = langMsgRaw;
            }
          }

          // Try to infer language from "file" field when backend doesn't send "language" key
          if (!detectedLanguage && backendErrors && backendErrors.file) {
            const fileErrRaw = Array.isArray(backendErrors.file) ? backendErrors.file[0] : backendErrors.file;
            if (typeof fileErrRaw === 'string') {
              // Look for patterns like "in English", "in Arabic", etc.
              const match = fileErrRaw.match(/in\s+([A-Za-z\u0600-\u06FF]+)/i);
              if (match && match[1]) {
                detectedLanguage = match[1];
              }
            }
          }

          // Persist detected language on the document when available
          if (detectedLanguage) {
            doc.language = detectedLanguage;
            this.documents[index] = { ...doc };
            this.documents = [...this.documents];
            this.cdr.detectChanges();
          }

          control.get('uploadStatus')?.setValue('error');
          control.get('errorMessage')?.setValue(errorMessage);
          doc.uploadStatus = 'error';
          doc.errorMessage = errorMessage;
          
          // Immediately reset upload in progress indicators for language mismatch errors
          if (errorMessage.toLowerCase().includes('language mismatch') || errorMessage.includes('Document language mismatch')) {
            this.pendingUploads = 0;
            this.uploadsInProgress = false;
            this.hasActiveUploads = false;
            
            // Clear any remaining files in the queue if this is a language error
            if (isFromQueue) {
              this.fileUploadQueue = [];
              this.isUploadInProgress = false;
            }
          }

          // Use warning toast when backend marks it as a warning
          if (backendType === 'warning') {
            // For language mismatch warnings, build a richer localized message
            const isLangMismatch =
              (errorMessage && errorMessage.toLowerCase().includes('document language mismatch')) ||
              (typeof backendErrors?.file === 'string' &&
                backendErrors.file.toLowerCase().includes('document language mismatch')) ||
              (Array.isArray(backendErrors?.file) &&
                backendErrors.file.some(
                  (m: any) => typeof m === 'string' && m.toLowerCase().includes('document language mismatch')
                ));

            const warningTitle = this.lang === 'ar' ? 'تحذير لغة المستند' : 'Document Language Warning';

            if (isLangMismatch) {
              const richMessage = this.buildLanguageMismatchMessage(detectedLanguage);
              // Fallback to backend message if for some reason we couldn't build a better one
              this.showWarn(warningTitle, richMessage || errorMessage);
            } else {
              this.showWarn(this.lang === 'ar' ? 'تحذير الرفع' : 'Upload Warning', errorMessage);
            }
          } else {
            this.showError(this.lang === 'ar' ? 'خطأ في الرفع' : 'Upload Error', errorMessage);
          }
        },
        complete: () => {
          // Decrement the pending uploads counter
          this.pendingUploads = Math.max(0, this.pendingUploads - 1);
          
          // Update all upload status indicators
          this.updateUploadStatusIndicators();
          
          // Remove from active subscriptions
          delete this.activeUploadSubscriptions[index];
          
          // Process next file in queue if this was from the queue
          if (isFromQueue) {
            this.processNextFileInQueue();
          }
        }
      });
      
    // Store the subscription so we can cancel it if needed
    this.activeUploadSubscriptions[index] = subscription;
  }

  // Method to update document details (title, price) - This will be called by the parent component
  updateDocumentDetails(): Promise<boolean> {
    if (!this.defaultValues.knowledgeId || this.documents.length === 0) {
      return Promise.resolve(true); // No documents to update
    }

    return this.performDocumentUpdate(false); // Start with ignore_mismatch: false
  }

  private performDocumentUpdate(ignoreMismatch: boolean): Promise<boolean> {
    // Prepare the documents data using IDs from form controls
    const documentsData = this.documentControls.controls.map((control, index) => {
      const docIdFromControl = control.get('docId')?.value;
      const doc = this.documents[index];
      
      // Use the ID from the form control (which should be updated during upload)
      return {
        id: docIdFromControl || doc.id,
        file_name: doc.file_name,
        price: doc.isCharity ? 0 : doc.price,
        ignore_mismatch: ignoreMismatch
      };
    });

    return new Promise((resolve, reject) => {
      this.addInsightStepsService.updateKnowledgeDocumentDetails(this.defaultValues.knowledgeId, documentsData)
        .subscribe({
          next: (response) => {
            if(this.lang=='ar'){
              this.showSuccess('', 'تم تحديث تفاصيل المستند بنجاح');
            }else{
              this.showSuccess('', 'Document details updated successfully');
            }
            // Clear last mismatch tracking on successful update
            this.lastLanguageMismatchDocs = [];
            resolve(true);
          },
                  error: (error) => {
          console.error('Error updating document details:', error);
          
          // Check if this is a language mismatch error
          if (this.isLanguageMismatchError(error)) {
            this.handleLanguageMismatchError(error)
              .then((shouldIgnore) => {
                if (shouldIgnore) {
                  // Retry with ignore_mismatch: true
                  this.performDocumentUpdate(true)
                    .then(resolve)
                    .catch(reject);
                } else {
                  // User chose to edit, don't proceed
                  resolve(false);
                }
              })
              .catch(() => {
                // User cancelled or error occurred
                resolve(false);
              });
          } else {
            // Handle other errors normally
            let errorMessage = 'Failed to update document details';
            if (error.error && error.error.message) {
              errorMessage += `: ${error.error.message}`;
            } else if (error.message) {
              errorMessage += `: ${error.message}`;
            }
            this.showError('Update Error', errorMessage);
            reject(error);
          }
        }
        });
    });
  }

  private isLanguageMismatchError(error: any): boolean {
    return error.error && 
           error.error.message && 
           (error.error.message.includes('File name not match document language') ||
            error.error.message.includes('اسم الملف غير متطابق مع لغة المستند')) &&
           error.error.errors;
  }

  private handleLanguageMismatchError(error: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        // Extract document indices from error
        const errorKeys = Object.keys(error.error.errors);
        const documentIndices: number[] = [];
        const affectedDocumentNames: string[] = [];
        const affectedDocsMeta: Array<{ id: string | number; name: string }> = [];

        errorKeys.forEach(key => {
          // Extract index from keys like "documents.55", "documents.44"
          const match = key.match(/documents\.(\d+)/);
          if (match) {
            const serverIndex = parseInt(match[1], 10);
            documentIndices.push(serverIndex);
            
            // The number in the error might be the document ID or server index, not local array index
            // Try multiple approaches to find the document name
            let documentFound = false;
            let documentName = '';
            let documentIdOrIndex: string | number = serverIndex;
            
            // Approach 1: Find by document ID in our documents array
            const docById = this.documents.find(doc => doc.id === serverIndex);
            if (docById) {
              documentName = docById.file_name;
              documentFound = true;
              documentIdOrIndex = docById.id ?? serverIndex;
            }
            
            // Approach 2: Find by docId in form controls
            if (!documentFound) {
              for (let i = 0; i < this.documentControls.controls.length; i++) {
                const control = this.documentControls.at(i);
                const docId = control.get('docId')?.value;
                if (docId === serverIndex) {
                  documentName = control.get('file_name')?.value || this.documents[i]?.file_name || '';
                  if (documentName) {
                    documentFound = true;
                    documentIdOrIndex = docId ?? serverIndex;
                    break;
                  }
                }
              }
            }
            
            // Approach 3: Check if serverIndex is actually an array index
            if (!documentFound && serverIndex < this.documents.length && this.documents[serverIndex]) {
              documentName = this.documents[serverIndex].file_name;
              if (documentName) {
                documentFound = true;
                documentIdOrIndex = serverIndex;
              }
            }
            
            // Approach 4: Search through all documents for any matching ID
            if (!documentFound) {
              const docWithMatchingId = this.documents.find(doc => 
                doc.id && (doc.id.toString() === serverIndex.toString())
              );
              if (docWithMatchingId) {
                documentName = docWithMatchingId.file_name;
                documentFound = true;
                documentIdOrIndex = docWithMatchingId.id ?? serverIndex;
              }
            }
            
            // Final fallback: Use a more descriptive generic name
            if (!documentFound || !documentName.trim()) {
              documentName = `Document (ID: ${serverIndex})`;
            }
            
            affectedDocumentNames.push(documentName);
            affectedDocsMeta.push({ id: documentIdOrIndex, name: documentName });
          }
        });

        // Always show the dialog even if we couldn't extract specific document names
        if (affectedDocumentNames.length === 0) {
          affectedDocumentNames.push('One or more documents');
          affectedDocsMeta.push({ id: 'unknown', name: 'One or more documents' });
        }
        
        // Always snapshot latest mismatch context so we can compare on next occurrences if needed
        this.lastLanguageMismatchDocs = affectedDocsMeta.map(d => ({ id: d.id, name: d.name }));

        // Store the affected documents for the modal
        this.languageMismatchDocuments = affectedDocumentNames;
        
        const message = this.translate.getTranslation('LANGUAGE_MISMATCH_MESSAGE');

        // Show confirmation dialog
        this.showConfirmationDialog(
          // this.translate.getTranslation('LANGUAGE_MISMATCH_DETECTED'),
          message,
          this.translate.getTranslation('LANGUAGE_MISMATCH_EDIT'),
          this.translate.getTranslation('LANGUAGE_MISMATCH_IGNORE')
        ).then((result) => {
          if (result) {
            // User clicked "Ignore"
            resolve(true);
          } else {
            // User clicked "Edit" or cancelled
            resolve(false);
          }
        }).catch(() => {
          resolve(false);
        });

      } catch (parseError) {
        console.error('Error parsing language mismatch error:', parseError);
        resolve(false);
      }
    });
  }

  private showConfirmationDialog(
    // title: string, 
    message: string, cancelText: string, confirmText: string): Promise<boolean> {
    return new Promise((resolve) => {
      // this.languageMismatchTitle = title;
      this.languageMismatchMessage = message;
      this.showLanguageMismatchDialog = true;
      this.languageMismatchResolver = resolve;
    });
  }

  onLanguageMismatchConfirm(): void {
    this.showLanguageMismatchDialog = false;
    if (this.languageMismatchResolver) {
      this.languageMismatchResolver(true); // User clicked "Ignore"
      this.languageMismatchResolver = null;
    }
  }

  onLanguageMismatchCancel(): void {
    this.showLanguageMismatchDialog = false;
    if (this.languageMismatchResolver) {
      this.languageMismatchResolver(false); // User clicked "Edit"
      this.languageMismatchResolver = null;
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
                    table_of_content: docInfo.table_of_content || [], // Make sure to include table_of_content
                    language: (docInfo as any).language // Include language from server
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
        table_of_content: doc.table_of_content || [], // Make sure to include table_of_content
        language: doc.language // Include language from input document
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

  private validateDocuments(enableLogging: boolean = true): boolean {
    // Don't allow proceeding if there are uploads in progress
    if (this.pendingUploads > 0 || this.hasActiveUploads) {
      return false;
    }
    
    // Check for any files with errors - BLOCK ANY ACTION until they are removed
    if (this.hasFilesWithErrors()) {
      return false;
    }
    
    // Allow proceeding with no documents if needed
    if (!this.documents.length) {
      return true; // Allow continuing with no documents
    }

    for (let i = 0; i < this.documents.length; i++) {
      const doc = this.documents[i];
      const control = this.documentControls.at(i);
      
      // Check if file name exists and is not empty
      if (!doc.file_name?.trim()) {
        return false;
      }

      // Price validation: must be >= 10 when not charity, or exactly 0 when charity
      const isCharity = control.get('isCharity')?.value;
      const priceValue = Number(control.get('price')?.value);
      if (!isCharity) {
        if (isNaN(priceValue) || priceValue < 10) {
          return false;
        }
      } else {
        if (priceValue !== 0) {
          return false;
        }
      }
      
      // We already checked for errors at the beginning, so this check is redundant
      // but we'll keep it for safety
      if (doc.uploadStatus === 'error') {
        return false;
      }
    }

    // Form is valid - all documents either uploaded or in progress
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
    // Check if there are any documents with 'uploading' status only
    // We specifically exclude 'pending' status for documents that have been successfully uploaded
    const uploadsInProgress = this.documents.some(doc => {
      return doc.uploadStatus === 'uploading';
    });
    
    // Also check the pendingUploads counter, but only if it's greater than 0
    // This helps prevent false positives
    return uploadsInProgress || (this.pendingUploads > 0 && this.uploadsInProgress);
  }
  
  // Method to update upload status indicators
  private updateUploadStatusIndicators(): void {
    // Count actual uploads in progress - only count documents that are actually uploading or pending
    const hasActiveUploads = this.documents.some(doc => {
      return (doc.uploadStatus === 'uploading' || doc.uploadStatus === 'pending');
    });
    
    // Update status flags
    this.uploadsInProgress = hasActiveUploads;
    this.hasActiveUploads = hasActiveUploads;
    
    // If no active uploads, reset pending counter and upload in progress flag
    if (!hasActiveUploads) {
      this.pendingUploads = 0;
      // Also reset the upload in progress flag to allow new uploads
      if (this.fileUploadQueue.length === 0) {
        this.isUploadInProgress = false;
      }
    }
  }

  // Method to check if any documents have upload errors
  hasUploadErrors(): boolean {
    return this.documents.some(doc => doc.uploadStatus === 'error');
  }
  
  // Method to check if there are any files with errors that need to be removed
  hasFilesWithErrors(): boolean {
    return this.documents.some(doc => doc.uploadStatus === 'error');
  }

  // Method to get documents with pending uploads - with detailed logging
  getPendingDocuments(): DocumentInfo[] {
    const pendingDocs = this.documents.filter(doc => {
      const isPending = (doc.uploadStatus === 'pending' || doc.uploadStatus === 'uploading');
      const hasNoId = !doc.id;
      const result = isPending && hasNoId;
      
      return result;
    });
    
    return pendingDocs;
  }
  
  // Method to cancel all active uploads
  cancelAllActiveUploads(): void {
    // Unsubscribe from all active upload subscriptions
    Object.keys(this.activeUploadSubscriptions).forEach(indexStr => {
      const index = parseInt(indexStr, 10);
      if (this.activeUploadSubscriptions[index]) {
        this.activeUploadSubscriptions[index].unsubscribe();
        delete this.activeUploadSubscriptions[index];
      }
    });
    
    // Reset all upload status indicators
    this.pendingUploads = 0;
    this.uploadsInProgress = false;
    this.hasActiveUploads = false;
    this.isUploadInProgress = false; // Reset upload in progress flag
    this.fileUploadQueue = []; // Clear the upload queue
    
    // Update document statuses
    this.documents.forEach((doc, index) => {
      if (doc.uploadStatus === 'uploading' || doc.uploadStatus === 'pending') {
        doc.uploadStatus = 'error';
        doc.errorMessage = 'Upload cancelled';
        
        // Update form control
        const control = this.documentControls.at(index);
        if (control) {
          control.get('uploadStatus')?.setValue('error');
          control.get('errorMessage')?.setValue('Upload cancelled');
        }
      }
    });
  }

  // Call this method to manually validate and update the parent
  validateAndUpdateParent(): void {
    const isValid = this.validateDocuments();
    this.updateParentModel({ documents: this.documents as IDocument[] }, isValid);
    
    // Also ensure upload status indicators are updated
    this.updateUploadStatusIndicators();
  }

  // Add debugging method to help identify document status issues
  logDocumentStatus(): void {
  }

  // Debug method to check template conditions
  checkLanguageDisplayConditions(): void {
  }

  // Localize language names for UI messages
  private localizeLanguageName(langValue: string | null | undefined, uiLang: string): string {
    if (!langValue) return '';
    const v = String(langValue).toLowerCase();
    const mapEn: { [k: string]: string } = {
      ar: 'Arabic',
      arabic: 'Arabic',
      en: 'English',
      english: 'English',
      fr: 'French',
      french: 'French',
      es: 'Spanish',
      spanish: 'Spanish'
    };
    const mapAr: { [k: string]: string } = {
      ar: 'العربية',
      arabic: 'العربية',
      en: 'الإنجليزية',
      english: 'الإنجليزية',
      fr: 'الفرنسية',
      french: 'الفرنسية',
      es: 'الإسبانية',
      spanish: 'الإسبانية'
    };
    return uiLang === 'ar' ? (mapAr[v] || v) : (mapEn[v] || v.charAt(0).toUpperCase() + v.slice(1));
  }

  // Build a rich, localized message for language mismatch cases
  private buildLanguageMismatchMessage(detectedLanguage: string | null | undefined): string {
    const localizedLang = this.localizeLanguageName(detectedLanguage || '', this.lang);
    if (this.lang === 'ar') {
      // Keep spaces around colon as requested
      const uploaded = localizedLang ? `لغة الملف المرفوع : ${localizedLang}` : '';
      const parts = [
        'عدم تطابق لغة المستند.',
        'يجب أن تكون جميع المستندات بنفس لغة المحتوى.',
        uploaded
      ].filter(Boolean);
      return parts.join(' ');
    }
    const uploaded = localizedLang ? `Uploaded file language: ${localizedLang}` : '';
    const parts = [
      'Document language mismatch.',
      'All documents must have the same language content.',
      uploaded
    ].filter(Boolean);
    return parts.join(' ');
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
      originalPrice: 0,
      language: undefined // Will be set after upload
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
        price: [0, [Validators.required, Validators.min(10)]],
        isCharity: [false],
        uploadStatus: ['pending'],
        uploadProgress: [0],
        errorMessage: [''],
        file: [file],
        file_extension: [fileExtension],
        file_size: [fileSize]
      });
      // Sync validators and enable/disable with charity toggle
      control.get('isCharity')?.valueChanges.subscribe(isCharity => {
        const priceControl = control.get('price');
        if (isCharity) {
          priceControl?.setValue(0);
          priceControl?.clearValidators();
          priceControl?.disable();
          priceControl?.updateValueAndValidity({ emitEvent: false });
        } else {
          priceControl?.enable();
          priceControl?.setValidators([Validators.required, Validators.min(10)]);
          priceControl?.updateValueAndValidity({ emitEvent: false });
        }
      });
      this.documentControls.push(control);
    }
    
    // Create a new array reference to ensure change detection
    this.documents = [...this.documents];
    
    // Upload the file to the server immediately
    this.uploadFileOnly(docIndex);
    
    // Update parent model
    this.updateParentModel({ documents: this.documents as IDocument[] }, this.validateDocuments());
  }

  // Add a direct method to get document IDs from the API
  getUploadedDocumentIds(): void {
    if (!this.defaultValues.knowledgeId) {
      return;
    }
    
    this.addInsightStepsService.getListDocumentsInfo(this.defaultValues.knowledgeId)
      .subscribe({
        next: (response) => {
          if (response && response.data) {
            // Update our local documents with server IDs
            this.documents.forEach((doc, index) => {
              // Find matching document from server by name
              const serverDoc = response.data.find(d => d.file_name === doc.file_name);
              if (serverDoc) {
                // Update document ID
                doc.id = serverDoc.id;
              }
            });
            
            // Force array update
            this.documents = [...this.documents];
          }
        },
        error: (error) => {
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
  get documentsControls(): FormArray {
  return this.documentsForm.get('documents') as FormArray;
}

  // Method to check if all documents are deleted and handle knowledge deletion
  private checkAndHandleEmptyDocuments(): void {
    // Check if we have a knowledgeId either from defaultValues or parent component
    const knowledgeId = this.defaultValues?.knowledgeId || this.parentComponent?.getCurrentAccount()?.knowledgeId;
    
    // Only proceed if there are no documents left and we have a knowledgeId and knowledge was created
    if (this.documents.length === 0 && knowledgeId && knowledgeId !== 0) {
      
      // Call the deleteKnowledge API
      this.knowledgeService.deleteKnowledge(knowledgeId)
        .subscribe({
          next: (response) => {
            
            // Reset the knowledge creation flag so user can start fresh
            this.knowledgeTypeCreated = false;
            
            // Clear the knowledgeId from defaultValues locally
            if (this.defaultValues) {
              this.defaultValues.knowledgeId = 0;
            }
            
            // Clear the knowledgeId from parent component
            if (this.parentComponent) {
              this.parentComponent.updateAccount({ knowledgeId: 0 }, true);
            }
            
            // Show success message
            if (this.lang === 'ar') {
              this.showInfo('', 'تم حذف المعرفة بنجاح');
            } else {
              this.showInfo('', 'Knowledge deleted successfully');
            }
          },
          error: (error) => {
            console.error('Error deleting knowledge:', error);
            
            // Even if deletion fails, reset the flag so user can re-upload
            this.knowledgeTypeCreated = false;
            
            // Clear the knowledgeId from defaultValues locally
            if (this.defaultValues) {
              this.defaultValues.knowledgeId = 0;
            }
            
            // Clear the knowledgeId from parent component
            if (this.parentComponent) {
              this.parentComponent.updateAccount({ knowledgeId: 0 }, true);
            }
            
            // Show error message
            let errorMessage = 'Failed to delete knowledge';
            if (error.error && error.error.message) {
              errorMessage += `: ${error.error.message}`;
            } else if (error.message) {
              errorMessage += `: ${error.message}`;
            }
            
            this.showError('', errorMessage);
          }
        });
    }
  }
}
