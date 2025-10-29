import { Component, EventEmitter, Injector, Input, OnInit, OnChanges, SimpleChanges, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseComponent } from 'src/app/modules/base.component';
import { AddInsightStepsService, DocumentInfo } from 'src/app/_fake/services/add-insight-steps/add-insight-steps.service';
import Swal from 'sweetalert2';

interface ChapterItem {
  title: string;
  id?: number;
  page_number?: number;
}

@Component({
  selector: 'app-document-modal',
  templateUrl: './document-modal.component.html',
  styleUrls: ['./document-modal.component.scss']
})
export class DocumentModalComponent extends BaseComponent implements OnInit, OnChanges {
  @Input() visible: boolean = false;
  @Input() knowledgeId: number | null = null;
  @Input() editingDocument: DocumentInfo | null = null;
  @Input() knowledgeType: string = '';
  @Input() preSelectedFile: File | null = null;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() documentSaved = new EventEmitter<void>();
  @Output() tryAnotherFileRequest = new EventEmitter<void>();

  documentForm: FormGroup;
  selectedFile: File | null = null;
  selectedFileName: string = '';
  selectedFileIcon: string = '';
  uploadProgress: number = 0;
  isUploading: boolean = false;
  isSaving: boolean = false;
  
  // AI Generation
  isGeneratingAbstract: boolean = false;
  abstractError: boolean = false;
  hasGeneratedAbstract: boolean = false;
  
  // Save state
  documentSuccessfullySaved: boolean = false;
  
  // Chapters
  showChapters: boolean = false;
  newChapterTitle: string = '';
  stepperChapters: ChapterItem[] = [];
  


  
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes
  


  constructor(
    injector: Injector,
    private fb: FormBuilder,
    private addInsightStepsService: AddInsightStepsService
  ) {
    super(injector);
    this.initializeForm();
  }

  ngOnInit(): void {
    // Initial setup will be handled in ngOnChanges
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      // Modal is being opened
      if (this.editingDocument) {
        this.populateFormForEdit();
      } else if (this.preSelectedFile) {
        this.handlePreSelectedFile();
      }
    }
    
    if (changes['editingDocument'] && this.editingDocument && this.visible) {
      this.populateFormForEdit();
    }
    
    if (changes['preSelectedFile'] && this.preSelectedFile && this.visible) {
      this.handlePreSelectedFile();
    }
  }

  private handlePreSelectedFile(): void {
    if (!this.preSelectedFile) return;

    const file = this.preSelectedFile;
    
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      const errorMessage = this.lang === 'ar' 
        ? `الملف "${file.name}" يتجاوز الحد الأقصى للحجم (100 ميجابايت)`
        : `File "${file.name}" exceeds the maximum size limit (100MB)`;
      
      this.showError(
        this.lang === 'ar' ? 'حجم الملف كبير جداً' : 'File Size Too Large',
        errorMessage
      );
      
      this.closeModal();
      return;
    }

    // Set file information
    this.selectedFile = file;
    this.selectedFileName = file.name;
    const extension = this.getFileExtension(file.name);
    this.selectedFileIcon = this.getFileIconByExtension(extension);
    
    // Update form values
    const fileNameWithoutExt = this.selectedFileName.includes('.') 
      ? this.selectedFileName.substring(0, this.selectedFileName.lastIndexOf('.'))
      : this.selectedFileName;
      
    this.documentForm.patchValue({
      file: file,
      file_name: fileNameWithoutExt,
      file_extension: extension
    });

    // Upload the file immediately
    if (this.knowledgeId) {
      this.uploadSelectedFile(file);
    }
  }

  private initializeForm(): void {
    this.documentForm = this.fb.group({
      id: [null],
      file_name: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      isCharity: [false],
      file: [null],
      file_extension: ['']
    });

    // Handle charity mode price changes
    this.documentForm.get('isCharity')?.valueChanges.subscribe(isCharity => {
      const priceControl = this.documentForm.get('price');
      if (isCharity) {
        priceControl?.setValue(0);
        priceControl?.disable();
      } else {
        priceControl?.enable();
      }
    });
  }

  private populateFormForEdit(): void {
    if (!this.editingDocument) return;

    // Set file display information for edit mode
    this.selectedFileName = this.editingDocument.file_name;
    this.selectedFileIcon = this.getFileIconByExtension(this.editingDocument.file_extension);
    
    // Patch form values
    this.documentForm.patchValue({
      id: this.editingDocument.id,
      file_name: this.editingDocument.file_name,
      description: this.editingDocument.description || '',
      price: this.editingDocument.price || '0',
      isCharity: this.editingDocument.price === '0',
      file_extension: this.editingDocument.file_extension
    });

    // Set editor content if available (only if not generated by AI)
    setTimeout(() => {
      if (this.editingDocument?.description && !this.hasGeneratedAbstract) {
        this.documentForm.patchValue({ description: this.editingDocument.description });
      }
    }, 100);

    // Load chapters if available
    if (this.editingDocument.table_of_content && this.editingDocument.table_of_content.length > 0) {
      this.showChapters = true;
      this.stepperChapters = this.editingDocument.table_of_content.map((item: any) => ({
        title: item.chapter?.title || ''
      })).filter((ch: ChapterItem) => ch.title !== '');
    }
  }

  // File handling
  triggerFileInput(): void {
    const fileInput = document.getElementById('documentFileInput') as HTMLInputElement;
    fileInput?.click();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      const errorMessage = this.lang === 'ar' 
        ? `الملف "${file.name}" يتجاوز الحد الأقصى للحجم (100 ميجابايت)`
        : `File "${file.name}" exceeds the maximum size limit (100MB)`;
      
      this.showError(
        this.lang === 'ar' ? 'حجم الملف كبير جداً' : 'File Size Too Large',
        errorMessage
      );
      
      event.target.value = '';
      return;
    }

    this.selectedFile = file;
    this.selectedFileName = file.name;
    const extension = this.getFileExtension(file.name);
    this.selectedFileIcon = this.getFileIconByExtension(extension);
    
    // Update form values
    const fileNameWithoutExt = this.selectedFileName.includes('.') 
      ? this.selectedFileName.substring(0, this.selectedFileName.lastIndexOf('.'))
      : this.selectedFileName;
      
    this.documentForm.patchValue({
      file: file,
      file_name: fileNameWithoutExt,
      file_extension: extension
    });

    // If adding a new document (not editing), upload the file immediately
    if (!this.editingDocument && this.knowledgeId) {
      this.uploadSelectedFile(file);
    }
  }

  private uploadSelectedFile(file: File): void {
    this.isUploading = true;
    this.uploadProgress = 0;
    
    const formData = new FormData();
    formData.append('file', file);
    
    this.addInsightStepsService.uploadKnowledgeDocumentWithProgress(this.knowledgeId!, formData)
      .subscribe({
        next: (event) => {
          if (event.type === 'progress') {
            this.uploadProgress = event.progress || 0;
          } else if (event.type === 'response' && event.response?.data) {
            const documentId = event.response.data.knowledge_document_id;
            
            if (documentId) {
              this.documentForm.patchValue({ id: documentId });
              this.showSuccess('', 'File uploaded successfully. Please complete the document details.');
              this.uploadProgress = 100;
            }
          }
        },
        error: (error) => {
          console.error('Upload error:', error);
          this.handleUploadError(error);
        },
        complete: () => {
          this.isUploading = false;
        }
      });
  }

  private handleUploadError(error: any): void {
    console.log('Upload error details:', error); // Debug log
    
    // Check for 413 Content Too Large error
    if (error.status === 413) {
      console.log('413 Content Too Large detected, closing modal'); // Debug log
      
      // Close the modal first
      this.closeModal();
      
      // Show content too large dialog
      setTimeout(() => {
        Swal.fire({
          title: this.lang === 'ar' ? 'الملف كبير جداً' : 'File Too Large',
          text: this.lang === 'ar' 
                      ? 'حجم الملف كبير جداً ولا يمكن رفعه. يرجى اختيار ملف أصغر حجماً.'
                      : 'The file is too large to upload. Please select a smaller file.',
          icon: 'error',
          confirmButtonText: this.lang === 'ar' ? 'حسناً' : 'OK',
          confirmButtonColor: '#d33',
          customClass: {
            container: 'swal-high-z-index'
          }
        });
      }, 300);
      return;
    }
    
    // Check for language mismatch error
    if (this.isLanguageMismatchError(error)) {
      console.log('Language mismatch detected, closing modal'); // Debug log
      
      // Close the modal first
      this.closeModal();
      
      // Show language mismatch dialog with Try Another File and Cancel options
      setTimeout(() => {
        Swal.fire({
          title: this.lang === 'ar' ? 'عدم تطابق اللغة' : 'Language Mismatch',
          text: this.lang === 'ar' 
                      ? 'هناك عدم تطابق في اللغة بين هذا المستند والمستندات الأخرى. يرجى التأكد من أن جميع المستندات بنفس اللغة.'
          : 'There is language mismatch between this document and other documents. Please make sure all documents are in the same language.',
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: this.lang === 'ar' ? 'جرب ملفًا آخر' : 'Try Another File',
          cancelButtonText: this.lang === 'ar' ? 'إلغاء' : 'Cancel',
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#6c757d',
          customClass: {
            container: 'swal-high-z-index'
          }
        }).then((result) => {
          if (result.isConfirmed) {
            // Try Another File - Trigger file selection from knowledge-details component
            this.tryAnotherFile();
          }
          // If dismissed (cancel), do nothing - modal is already closed
        });
      }, 300);
      return;
    }

    // Handle other errors
    console.log('Not a language mismatch error, handling as general error'); // Debug log
    let errorMessage = 'Error uploading file';
    if (error.error?.message) {
      errorMessage = error.error.message;
    }
    
    this.showError('Upload Error', errorMessage);
    this.resetFileSelection();
  }



  private resetFileSelection(): void {
    this.selectedFile = null;
    this.selectedFileName = '';
    this.selectedFileIcon = '';
    this.uploadProgress = 0;
    this.documentForm.patchValue({
      file: null,
      file_extension: ''
    });
  }

  private deleteUploadedFile(documentId: number): void {
    this.addInsightStepsService.deleteKnowledgeDocument(documentId).subscribe({
      next: () => {
        console.log('Uploaded file deleted successfully');
      },
      error: (error) => {
        console.error('Error deleting uploaded file:', error);
      }
    });
  }

  // AI Abstract Generation
  generateAIAbstract(): void {
    const documentId = this.documentForm.get('id')?.value;
    if (!documentId) {
      this.showError('', 'Please upload a file first');
      return;
    }

    // Check if there's existing content
    const currentContent = this.documentForm.get('description')?.value;
    if (currentContent && currentContent.trim() !== '') {
      Swal.fire({
        title: this.lang === 'ar' ? 'محتوى موجود' : 'Existing Content',
        text: this.lang === 'ar' 
          ? 'هذا سيحل محل الوصف الحالي. هل تريد المتابعة؟'
          : 'This will replace your current description. Continue?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: this.lang === 'ar' ? 'نعم، إنشاء جديد' : 'Yes, generate new',
        cancelButtonText: this.lang === 'ar' ? 'إلغاء' : 'Cancel',
        customClass: {
          container: 'swal-high-z-index'
        }
      }).then((result) => {
        if (result.isConfirmed) {
          this.processAIAbstract(documentId);
        }
      });
    } else {
      this.processAIAbstract(documentId);
    }
  }

  private processAIAbstract(docId: number): void {
    this.isGeneratingAbstract = true;
    this.abstractError = false;
    this.hasGeneratedAbstract = false; // Reset flag when starting new generation
    
    // Show loading message
    this.showInfo('', 
      this.lang === 'ar' 
        ? 'جاري تحليل المستند وإنشاء الملخص...'
        : 'Analyzing document and generating abstract...'
    );
    
    // First trigger document parsing
    this.addInsightStepsService.runDocumentParser(docId).subscribe({
      next: () => {
        this.startSummaryPolling(docId);
      },
      error: (error: any) => {
        console.error('Error starting document parsing:', error);
        this.isGeneratingAbstract = false;
        this.abstractError = true;
        this.showError('', 
          this.lang === 'ar' 
            ? 'فشل في بدء تحليل المستند'
            : 'Failed to start document analysis'
        );
      }
    });
  }

  private startSummaryPolling(docId: number): void {
    const maxWaitTime = 25000;
    const pollingInterval = 2000;
    let elapsedTime = 0;
    
    const polling = setInterval(() => {
      elapsedTime += pollingInterval;
      
      this.fetchDocumentSummary(docId, polling);
      
      if (elapsedTime >= maxWaitTime) {
        clearInterval(polling);
        if (this.isGeneratingAbstract) {
          this.isGeneratingAbstract = false;
          this.abstractError = true;
          this.showError('', 
            this.lang === 'ar' 
              ? 'انتهت مهلة إنشاء الملخص. يرجى المحاولة مرة أخرى.'
              : 'Abstract generation timed out. Please try again.'
          );
        }
      }
    }, pollingInterval);
  }

  private fetchDocumentSummary(docId: number, pollingIntervalId?: any): void {
    this.addInsightStepsService.getDocumentSummary(docId).subscribe({
      next: (response: any) => {
        if (response.data) {
          let summary:any = null;
          const responseData: any = response.data;
          
          // Check for data.summary.abstract first (primary format)
          if (typeof responseData === 'object' && responseData.summary?.abstract) {
            summary = responseData.summary.abstract;
          } else if (typeof responseData === 'string') {
            summary = responseData;
          } else if (responseData.summary && typeof responseData.summary === 'string') {
            summary = responseData.summary;
          }
          
          if (summary && summary.trim() !== '') {
            // First update the form control
            this.documentForm.patchValue({ description: summary });
            
            // TinyMCE automatically updates through reactive forms
            // No additional editor manipulation needed
            
            if (pollingIntervalId) {
              clearInterval(pollingIntervalId);
            }
            
            this.isGeneratingAbstract = false;
            this.abstractError = false;
            this.hasGeneratedAbstract = true; // Mark that AI abstract has been generated
            
            // Show success message
            this.showSuccess('', 
              this.lang === 'ar' 
                ? 'تم إنشاء الملخص بنجاح'
                : 'AI abstract generated successfully'
            );
          } else if (!pollingIntervalId) {
            this.abstractError = true;
            this.isGeneratingAbstract = false;
          }
        }
      },
      error: (error) => {
        console.error('Error getting document summary:', error);
        const isMetadataError = error?.error?.message?.includes('Attempt to read property "metadata" on null');
        
        if (!pollingIntervalId || !isMetadataError) {
          this.isGeneratingAbstract = false;
          this.abstractError = true;
          this.showError('', 
            this.lang === 'ar' 
              ? 'حدث خطأ أثناء إنشاء الملخص'
              : 'Error occurred while generating abstract'
          );
        }
      }
    });
  }



  // TinyMCE Editor handling
  // TinyMCE automatically handles content changes through reactive forms
  // No additional editor instance management needed

  // Chapter handling
  toggleChapters(): void {
    this.showChapters = !this.showChapters;
  }

  addChapter(): void {
    if (!this.newChapterTitle || !this.newChapterTitle.trim()) {
      return;
    }
    
    this.stepperChapters.push({
      title: this.newChapterTitle.trim()
    });
    
    this.newChapterTitle = '';
  }

  removeChapter(index: number): void {
    this.stepperChapters.splice(index, 1);
  }

  // Save functionality
  saveDocument(): void {
    if (this.documentForm.invalid) {
      this.documentForm.markAllAsTouched();
      return;
    }

    if (!this.selectedFile && !this.editingDocument) {
      this.showError('', 'Please select a file to upload');
      return;
    }

    this.isSaving = true;
    
    if (this.editingDocument) {
      this.updateExistingDocument();
    } else {
      this.saveNewDocument();
    }
  }

  private saveNewDocument(): void {
    const documentId = this.documentForm.get('id')?.value;
    
    if (!documentId) {
      this.showError('', 'No document has been uploaded. Please select a file first.');
      this.isSaving = false;
      return;
    }
    
    // Update document details with language mismatch handling
    this.updateDocumentDetailsWithMismatchHandling(documentId, false)
      .then((success: boolean) => {
        if (!success) {
          this.isSaving = false;
          return;
        }
        
        // Update document description
        const description = this.documentForm.get('description')?.value;
        const chapters = this.stepperChapters.length > 0 ? 
          this.stepperChapters.map(chapter => ({
            id: chapter.id,
            title: chapter.title,
            page_number: chapter.page_number
          })) : [];
          
        const abstractRequest = {
          documents: [{
            id: documentId,
            description: description || '',
            table_of_content: chapters
          }]
        };
        
        this.addInsightStepsService.updateKnowledgeAbstracts(this.knowledgeId!, abstractRequest)
          .subscribe({
            next: () => {
              this.documentSuccessfullySaved = true; // Mark as successfully saved
              this.showSuccess('', 'Document added successfully');
              this.documentSaved.emit();
              this.closeModal();
              this.isSaving = false;
            },
            error: (error: any) => {
              this.showError('', error?.error?.message || 'Error setting document description');
              this.isSaving = false;
            }
          });
      })
      .catch((error: any) => {
        this.showError('', error?.error?.message || 'Error setting document details');
        this.isSaving = false;
      });
  }

  private updateExistingDocument(): void {
    // Update document details
    this.updateDocumentDetailsWithMismatchHandling(this.editingDocument!.id, true)
      .then((success: boolean) => {
        if (!success) {
          this.isSaving = false;
          return;
        }
        
        // Update document description
        const description = this.documentForm.get('description')?.value;
        const chapters = this.stepperChapters.length > 0 ? 
          this.stepperChapters.map(chapter => ({
            id: chapter.id,
            title: chapter.title,
            page_number: chapter.page_number
          })) : [];
          
        const abstractRequest = {
          documents: [{
            id: this.editingDocument!.id,
            description: description || '',
            table_of_content: chapters
          }]
        };
        
        this.addInsightStepsService.updateKnowledgeAbstracts(this.knowledgeId!, abstractRequest)
          .subscribe({
            next: () => {
              this.documentSuccessfullySaved = true; // Mark as successfully saved
              this.showSuccess('', 'Document updated successfully');
              this.documentSaved.emit();
              this.closeModal();
              this.isSaving = false;
            },
            error: (error: any) => {
              this.showError('', error?.error?.message || 'Error updating document description');
              this.isSaving = false;
            }
          });
      })
      .catch((error: any) => {
        this.showError('', error?.error?.message || 'Error updating document details');
        this.isSaving = false;
      });
  }

  private updateDocumentDetailsWithMismatchHandling(documentId: number, ignoreMismatch: boolean): Promise<boolean> {
    const documentDetailsRequest = {
      documents: [{
        id: documentId,
        file_name: this.documentForm.get('file_name')?.value,
        price: this.documentForm.get('isCharity')?.value ? '0' : this.documentForm.get('price')?.value,
        ignore_mismatch: ignoreMismatch
      }]
    };

    return new Promise((resolve, reject) => {
      this.addInsightStepsService.updateKnowledgeDocumentDetails(this.knowledgeId!, documentDetailsRequest.documents)
        .subscribe({
          next: () => {
            resolve(true);
          },
          error: (error) => {
            if (this.isLanguageMismatchError(error)) {
              this.handleLanguageMismatchError()
                .then((shouldIgnore) => {
                  if (shouldIgnore) {
                    this.updateDocumentDetailsWithMismatchHandling(documentId, true)
                      .then(resolve)
                      .catch(reject);
                  } else {
                    resolve(false);
                  }
                })
                .catch(() => {
                  resolve(false);
                });
            } else {
              reject(error);
            }
          }
        });
    });
  }

  private isLanguageMismatchError(error: any): boolean {
    // Check for the specific error structure from the API
    const isDocumentLanguageMismatch = error.error && 
           error.error.message && 
           (error.error.message.includes('Document language mismatch') ||
            error.error.message.includes('File name not match document language') ||
            error.error.message.includes('اسم الملف غير متطابق مع لغة المستند') ||
            error.error.message.includes('عدم تطابق لغة المستند'));
    
    // Also check for specific file error in errors object
    const hasFileLanguageMismatchError = error.error && 
           error.error.errors && 
           error.error.errors.file && 
           Array.isArray(error.error.errors.file) &&
           error.error.errors.file.some((msg: string) => 
             msg.includes('Document language mismatch') ||
             msg.includes('language mismatch')
           );
           
    return isDocumentLanguageMismatch || hasFileLanguageMismatchError;
  }

  private handleLanguageMismatchError(): Promise<boolean> {
    const fileName = this.documentForm.get('file_name')?.value || '';
    
    return new Promise((resolve) => {
      Swal.fire({
        title: this.lang === 'ar' ? 'عدم تطابق اللغة في العنوان' : 'Title Language Mismatch',
        text: this.lang === 'ar' 
          ? `العنوان "${fileName}" يستخدم لغة مختلفة عن محتوى المستند. هل أنت متأكد من المتابعة؟`
          : `The title "${fileName}" uses different language than document's content. Are you sure you want to continue?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: this.lang === 'ar' ? 'تجاهل الاختلاف' : 'Ignore Mismatch',
        cancelButtonText: this.lang === 'ar' ? 'تعديل' : 'Edit',
        reverseButtons: this.lang === 'ar',
        customClass: {
          container: 'swal-high-z-index'
        }
      }).then((result) => {
        resolve(result.isConfirmed);
      }).catch(() => {
        resolve(false);
      });
    });
  }

  // Utility functions
  private getFileExtension(filename: string): string {
    if (!filename) return '';
    const match = filename.match(/\.([^.]+)$/);
    return match ? match[1].toUpperCase() : '';
  }

  getFileIconByExtension(fileExtension: string): string {
    if (!fileExtension) return './assets/media/svg/new-files/default.svg';
    
    const iconMap: { [key: string]: string } = {
      pdf: './assets/media/svg/new-files/pdf.svg',
      doc: './assets/media/svg/new-files/doc.svg',
      docx: './assets/media/svg/new-files/docx.svg',
      xls: './assets/media/svg/new-files/xls.svg',
      ppt: './assets/media/svg/new-files/ppt.svg',
      pptx: './assets/media/svg/new-files/pptx.svg',
      txt: './assets/media/svg/new-files/txt.svg',
      zip: './assets/media/svg/new-files/zip.svg',
      xlsx: './assets/media/svg/new-files/xlsx.svg',
      default: './assets/media/svg/new-files/default.svg',
    };
    const ext = fileExtension.toLowerCase();
    return iconMap[ext] || iconMap.default;
  }
  
  getFileSize(): string {
    if (this.selectedFile) {
      return this.formatFileSize(this.selectedFile.size);
    }
    if (this.editingDocument?.file_size) {
      return this.formatFileSize(this.editingDocument.file_size);
    }
    return '';
  }
  
  getDisplayFileName(): string {
    return this.selectedFileName || this.editingDocument?.file_name || '';
  }
  
  getDisplayFileIcon(): string {
    if (this.selectedFileIcon) return this.selectedFileIcon;
    if (this.editingDocument?.file_extension) {
      return this.getFileIconByExtension(this.editingDocument.file_extension);
    }
    return './assets/media/svg/new-files/default.svg';
  }
  
  getDisplayFileExtension(): string {
    if (this.editingDocument?.file_extension) {
      return this.editingDocument.file_extension;
    }
    if (this.selectedFile?.name) {
      const parts = this.selectedFile.name.split('.');
      return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : '';
    }
    return '';
  }

  formatFileSize(size: number): string {
    if (size < 1024) {
      return size + ' bytes';
    } else if (size < 1024 * 1024) {
      return (size / 1024).toFixed(2) + ' KB';
    } else {
      return (size / (1024 * 1024)).toFixed(2) + ' MB';
    }
  }

  handlePriceInput(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    const value = inputElement.value;
    
    if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
      const numericValue = parseInt(value, 10).toString();
      this.documentForm.get('price')?.setValue(numericValue, { emitEvent: false });
      inputElement.value = numericValue;
    }
  }

  // Modal controls
  closeModal(): void {
    // TinyMCE handles cleanup automatically
    
    // Only delete uploaded document if it wasn't successfully saved AND user is canceling (not in edit mode)
    const documentId = this.documentForm.get('id')?.value;
    if (documentId && !this.editingDocument && !this.documentSuccessfullySaved) {
      this.deleteUploadedFile(documentId);
    }
    
    this.visible = false;
    this.visibleChange.emit(false);
    
    // Only reset form if not in edit mode
    if (!this.editingDocument) {
      this.resetForm();
    } else {
      // For edit mode, only reset temporary states but keep the form data
      this.resetTemporaryStates();
    }
  }

  /**
   * Emits an event to request trying another file upload
   * This is called when the user clicks "Try Another File" in the language mismatch dialog
   */
  tryAnotherFile(): void {
    console.log('Requesting to try another file');
    this.tryAnotherFileRequest.emit();
  }

  private resetForm(): void {
    this.documentForm.reset();
    this.resetFileSelection();
    this.showChapters = false;
    this.stepperChapters = [];
    this.newChapterTitle = '';
    this.isGeneratingAbstract = false;
    this.abstractError = false;
    this.hasGeneratedAbstract = false;
    this.isSaving = false;
    this.documentSuccessfullySaved = false; // Reset save flag
    this.editingDocument = null;
    this.preSelectedFile = null; // Clear pre-selected file
  }

  private resetTemporaryStates(): void {
    // Reset only temporary states, keep form data and editingDocument
    this.newChapterTitle = '';
    this.isGeneratingAbstract = false;
    this.abstractError = false;
    this.hasGeneratedAbstract = false;
    this.isSaving = false;
    this.isUploading = false;
    this.uploadProgress = 0;
    this.documentSuccessfullySaved = false; // Reset save flag
  }

  // Validation
  isFormValid(): boolean {
    const fileNameValid = this.documentForm.get('file_name')?.valid;
    const descriptionValid = this.documentForm.get('description')?.valid;
    const fileValid = !!this.selectedFile || !!this.editingDocument;
    const priceValid = this.documentForm.get('isCharity')?.value || this.documentForm.get('price')?.valid;
    
    return !!fileNameValid && !!descriptionValid && fileValid && !!priceValid;
  }
}