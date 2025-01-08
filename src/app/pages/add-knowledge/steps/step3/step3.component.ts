import { Component, Injector, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { BaseComponent } from 'src/app/modules/base.component';
import { TranslationService } from 'src/app/modules/i18n/translation.service';
import { AddInsightStepsService, DocumentInfo } from 'src/app/_fake/services/add-insight-steps/add-insight-steps.service';
import { ICreateKnowldege } from '../../create-account.helper';
import { trigger, transition, style, animate } from '@angular/animations';

interface FilePreview {
  file: File | null; 
  name: string;
  size: number;      
  preview: string | null; 
  type: string;      
  icon?: string;     
  docId?: number;    
  fromServer?: boolean; 
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
  @Input('updateParentModel') updateParentModel: (
    part: Partial<ICreateKnowldege>,
    isFormValid: boolean
  ) => void;

  form: FormGroup;
  @Input() defaultValues: Partial<ICreateKnowldege>;
  @Input() knowledgeId!: number;

  selectedFiles: File[] = [];
  previewFiles: FilePreview[] = [];

  // Holds the parsed Table of Content data
  parsedToc: any = null;

  private subscriptions: Subscription[] = [];

  constructor(
    injector: Injector,
    private fb: FormBuilder,
    private translationService: TranslationService,
    private addInsightStepsService: AddInsightStepsService
  ) {
    super(injector);
  }

  ngOnInit() {
    this.initForm();
    this.updateParentModel({}, this.checkForm());

    // Load existing document if knowledgeId is present
    if (this.knowledgeId) {
      this.loadExistingDocument();
    }

    const formChangesSubscr = this.form.valueChanges.subscribe((val) => {
      this.updateParentModel(val, this.checkForm());
    });
    this.subscriptions.push(formChangesSubscr);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  initForm() {
    this.form = this.fb.group({
      file_name: [this.defaultValues.file_name || '', Validators.required],
      price: [this.defaultValues.price || null, [Validators.required, Validators.min(0)]],
      file: [null],
      table_of_content: [this.defaultValues.table_of_content || '']
    });
  }

  /**
   * Loads existing document information if available.
   */
  loadExistingDocument() {
    this.addInsightStepsService.getListDocumentsInfo(this.knowledgeId).subscribe({
      next: (response) => {
        if (response.data?.length) {
          const existingDoc: DocumentInfo = response.data[0];

          // Patch form with retrieved file_name and price
          this.form.patchValue({
            file_name: existingDoc.file_name,
            price: Number(existingDoc.price) || 0
          });

          // Parse and set the Table of Content
          const rawToc = existingDoc.table_of_content;
          if (rawToc) {
            this.parsedToc = this.unreshapeTableOfContent(rawToc);
            this.form.patchValue({ table_of_content: rawToc });
          }

          // Fetch document URL for preview
          this.addInsightStepsService.getDocumentUrl(existingDoc.id).subscribe({
            next: (res) => {
              const docUrl = res.data.url;
              const preview: FilePreview = {
                file: null,
                name: existingDoc.file_name,
                size: 0,
                preview: docUrl,
                type: this.getFileTypeByExtension(existingDoc.file_name),
                icon: this.getFileIconByExtension(existingDoc.file_name),
                docId: existingDoc.id,
                fromServer: true
              };
              this.previewFiles = [preview];
            },
            error: (err) => {
              console.error('Error fetching document URL:', err);
              this.showError('', 'Failed to load document preview.');
            }
          });
        }
      },
      error: (err) => {
        console.error('Error fetching document info:', err);
        this.showError('', 'Failed to load document information.');
      }
    });
  }

  /**
   * Parses the reshaped Table of Content JSON back to its original structure.
   * @param jsonString The reshaped JSON string from the server.
   * @returns The original Table of Content structure.
   */
  private unreshapeTableOfContent(jsonString: string): any {
    try {
      const arr = JSON.parse(jsonString);
      if (!Array.isArray(arr)) {
        return { chapters: [] };
      }
      const chapters = arr.map((item: any) => {
        return {
          name: item.Chapter?.title || '',
          index: item.Chapter?.page || 1,
          subChapters: (item.Chapter?.sub_child || []).map((sub: any) => {
            return {
              name: sub.title,
              index: sub.page
            };
          })
        };
      });
      return { chapters };
    } catch (e) {
      console.error('Invalid table_of_content JSON:', e);
      return { chapters: [] };
    }
  }

  /**
   * Handles changes emitted from the TableOfContentComponent.
   * @param tocData The updated Table of Content data.
   */
  handleTocChange(tocData: any) {
    const json = JSON.stringify(tocData);
    this.form.patchValue({ table_of_content: json });
    this.updateParentModel({ table_of_content: json }, this.checkForm());
  }

  /**
   * Handles file selection from the user.
   * @param event The file input event.
   */
  onFilesSelected(event: any) {
    const files: FileList = event.target.files;
    if (files.length > 0) {
      const file = files[0];
      this.form.patchValue({ file });
      this.updateParentModel({ file }, this.checkForm());

      const preview: FilePreview = {
        file,
        name: file.name,
        size: file.size,
        preview: null,
        type: this.getFileTypeByExtension(file.name),
        icon: this.getFileIconByExtension(file.name)
      };
      this.previewFiles = [preview];
    }
  }

  /**
   * Removes a selected or existing file.
   * @param preview The file preview to remove.
   */
  removeFile(preview: FilePreview) {
    if (preview.fromServer && preview.docId) {
      const confirmed = window.confirm('Are you sure you want to delete this document?');
      if (confirmed) {
        this.addInsightStepsService.deleteKnowledgeDocument(preview.docId).subscribe({
          next: () => {
            // Remove from preview
            this.previewFiles = [];
            // Clear form fields related to the document
            this.form.patchValue({ file: null, file_name: '', price: '', table_of_content: '' });
            this.showInfo('', 'Document deleted successfully.');
          },
          error: (err) => {
            console.error('Error deleting document:', err);
            this.showError('', 'Could not delete the document.');
          }
        });
      }
    } else {
      // Remove local file preview
      this.previewFiles = [];
      this.form.patchValue({ file: null });
    }
    this.updateParentModel(this.form.value, this.checkForm());
  }

  /**
   * Checks if the form is valid.
   * The form is valid if:
   * 1. All required fields are filled.
   * 2. Either a file is uploaded or an existing document is present.
   * @returns Boolean indicating form validity.
   */
  checkForm() {
    const hasFileFromServer = this.previewFiles.some(p => p.fromServer);
    const hasLocalFile = !!this.form.get('file')?.value;
    if (!this.form.valid) {
      return false;
    }
    // Must have either a server document or an uploaded file
    return (hasFileFromServer || hasLocalFile);
  }

  /**
   * Determines the file type based on its extension.
   * @param fileName The name of the file.
   * @returns The file type.
   */
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

  /**
   * Returns the icon path based on the file type.
   * @param fileName The name of the file.
   * @returns The path to the file icon.
   */
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
}