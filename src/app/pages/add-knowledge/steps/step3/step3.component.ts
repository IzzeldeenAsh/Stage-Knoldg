import { Component, OnInit, OnDestroy, Injector, ViewChild, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BaseComponent } from 'src/app/modules/base.component';
import { AddInsightStepsService } from 'src/app/_fake/services/add-insight-steps/add-insight-steps.service';
import { ICreateKnowldege } from '../../create-account.helper';
import { trigger, transition, style, animate } from '@angular/animations';
import { ChangeDetectorRef } from '@angular/core';
import { TableOfContentComponent } from '../../../../reusable-components/table-of-content/table-of-content.component';

interface FilePreview {
  file: File | null;
  name: string;
  size: number;      
  preview: string | null; 
  type: string;      
  icon?: string;     
  docId?: number;    
  fromServer?: boolean; 
  isExisting?: boolean;
}

@Component({
  selector: 'app-step3',
  templateUrl: './step3.component.html',
  styleUrls: ['./step3.component.scss'],
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
export class Step3Component extends BaseComponent implements OnInit, OnDestroy {
  @ViewChild(TableOfContentComponent) tocComponent!: TableOfContentComponent;

  @Input('updateParentModel') updateParentModel: (
    part: Partial<ICreateKnowldege>,
    isFormValid: boolean
  ) => void;

  @Input() defaultValues: Partial<ICreateKnowldege>;
  @Input() knowledgeId!: number;

  documents: any[] = [];
  docForm: FormGroup;
  previewFilesDialog: FilePreview[] = [];
  displayDocumentDialog = false;
  editingIndex = -1;
  subscriptions: Subscription[] = [];

  constructor(
    injector: Injector,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private addInsightStepsService: AddInsightStepsService
  ) {
    super(injector);
  }

  ngOnInit() {
    this.documents = this.defaultValues.documents ? this.defaultValues.documents : [];
    this.updateParentModel({ documents: this.documents }, this.checkParentValidator());
    this.initDocForm();
    
    if (this.knowledgeId) {
      this.fetchDocumentsFromServer();
    }
  }

  initDocForm(): void {
    this.docForm = this.fb.group({
      file_name: ['', Validators.required],
      table_of_content: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      file: [null],
      file_extension: ['']
    });
    this.previewFilesDialog = [];
  }

  private fetchDocumentsFromServer() {
    this.addInsightStepsService.getListDocumentsInfo(this.knowledgeId)
      .subscribe({
        next: (response) => {
          const documentInfos = response.data;
          // Fetch URLs for each document
          documentInfos.forEach(docInfo => {
            this.addInsightStepsService.getDocumentUrl(docInfo.id)
              .subscribe({
                next: (urlResponse) => {
                  const serverDoc = {
                    ...docInfo,
                    docUrl: urlResponse.data.url,
                    fromServer: true,
                    file: null,
                    status: 'active'
                  };
                  this.documents.push(serverDoc);
                  this.updateParentModel({ documents: this.documents }, this.checkParentValidator());
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

  openDocumentDialog(docIndex = -1): void {
    this.editingIndex = docIndex;
    this.displayDocumentDialog = true;
    this.initDocForm();

    if (docIndex >= 0) {
      const existingDoc = this.documents[docIndex];
      this.docForm.patchValue({
        file_name: existingDoc.file_name || '',
        table_of_content: existingDoc.table_of_content || '',
        price: existingDoc.price || 0,
        file_extension: existingDoc.file_extension || '',
        file: existingDoc.file || null
      });

      if (existingDoc.file) {
        // Document has a file uploaded on the client side
        this.previewFilesDialog = [{
          file: existingDoc.file,
          name: existingDoc.file.name,
          size: existingDoc.file.size,
          preview: null,
          type: this.getFileTypeByExtension(existingDoc.file.name),
          icon: this.getFileIconByExtension(existingDoc.file.name),
          isExisting: false
        }];
      } else if (existingDoc.fromServer) {
        // Document exists on the server
        const preview: FilePreview = {
          file: null,
          name: existingDoc.file_name,
          size: existingDoc.file_size || 0,
          preview: existingDoc.docUrl || '',
          type: this.getFileTypeByExtension(existingDoc.file_name),
          icon: this.getFileIconByExtension(existingDoc.file_name + '.' + (existingDoc.file_extension || '')),
          docId: existingDoc.id,
          fromServer: true,
          isExisting: true // Mark as existing
        };
        this.previewFilesDialog = [preview];
      }
    }
  }

  saveDocument(): void {
    if (this.docForm.invalid) {
      this.docForm.markAllAsTouched();
      return;
    }

    const fileName = this.docForm.value.file_name || '';
    const file: File | null = this.docForm.value.file;

    const newDoc: any = {
      file_name: fileName,
      table_of_content: this.docForm.value.table_of_content || '',
      price: this.docForm.value.price || 0,
      status: 'active',
      file_extension: file ? this.getFileExtension(file.name) : this.getFileExtension(fileName)
    };

    if (file) {
      newDoc.file = file;
    } else {
      // If no new file is uploaded, retain server-stored file information
      const existingDoc = this.documents[this.editingIndex];
      newDoc.docUrl = existingDoc.docUrl;
      newDoc.id = existingDoc.id;
      newDoc.fromServer = existingDoc.fromServer;
    }

    if (this.editingIndex >= 0) {
      this.documents[this.editingIndex] = { ...this.documents[this.editingIndex], ...newDoc };
    } else {
      this.documents.push(newDoc);
    }

    this.updateParentModel({ documents: this.documents }, this.checkParentValidator());

    this.initDocForm();

    if (this.tocComponent) {
      this.tocComponent.reset();
    }

    this.closeDialog();
  }

  removeDocument(index: number) {
    if (index >= 0 && index < this.documents.length) {
      this.documents.splice(index, 1);
      this.updateParentModel({ documents: this.documents }, this.checkParentValidator());
    }
  }

  closeDialog(): void {
    this.displayDocumentDialog = false;
    this.editingIndex = -1;
    this.initDocForm();
    if (this.tocComponent) {
      this.tocComponent.reset();
    }
  }

  onFilesSelectedDialog(event: any): void {
    const files: FileList = event.target.files;
    if (files.length > 0) {
      const file = files[0];
      const fileExtension = file.name.split('.').pop()?.toUpperCase() || '';
      
      this.docForm.patchValue({ 
        file,
        file_extension: fileExtension
      });
      
      const preview: FilePreview = {
        file,
        name: file.name,
        size: file.size,
        preview: null,
        type: this.getFileTypeByExtension(file.name),
        icon: this.getFileIconByExtension(file.name)
      };
      this.previewFilesDialog = [preview];
    }
  }

  removeFileDialog(preview: FilePreview): void {
    this.previewFilesDialog = [];
    this.docForm.patchValue({ file: null });
  }

  handleTocChange(tocData: any) {
    const json = JSON.stringify(tocData);
    this.docForm.patchValue({ table_of_content: json });
  }

  checkParentValidator(): boolean {
    if (!this.documents.length) {
      return false;
    }
    for (const doc of this.documents) {
      if (!doc.file_name || doc.price === null || doc.price < 0) {
        return false;
      }
    }
    return true;
  }

  private getFileTypeByExtension(fileName: string): string {
    const extension = (fileName.split('.').pop() || '').toLowerCase();
    const typeMap: { [key: string]: string } = {
      pdf: 'pdf',
      doc: 'word',
      docx: 'word',
      xls: 'excel',
      xlsx: 'excel',
      ppt: 'powerpoint',
      pptx: 'powerpoint',
      txt: 'text',
      zip: 'archive',
      rar: 'archive',
      csv: 'excel',
      rtf: 'document'
    };
    return typeMap[extension] || 'document';
  }

  private getFileIconByExtension(fileName: string): string {
    const fileType = this.getFileTypeByExtension(fileName);
    const iconMap: { [key: string]: string } = {
      pdf: './assets/media/svg/files/pdf.svg',
      word: './assets/media/svg/files/doc.svg',
      excel: './assets/media/svg/files/xls.svg',
      powerpoint: './assets/media/svg/files/ppt.svg',
      text: './assets/media/svg/files/txt.svg',
      archive: './assets/media/svg/files/zip.svg',
      document: './assets/media/svg/files/default.svg'
    };
    return iconMap[fileType] || iconMap.document;
  }

  private getFileExtension(fileName: string): string {
    if (!fileName) return '';
    
    const parts = fileName.split('.');
    if (parts.length <= 1) return '';
    
    return parts[parts.length - 1].toUpperCase();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}