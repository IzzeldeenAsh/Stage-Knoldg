import { Component, Injector, Input, OnInit } from '@angular/core';
import { FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { BaseComponent } from 'src/app/modules/base.component';
import { ICreateKnowldege } from '../../../create-account.helper';
import { trigger, transition, style, animate } from '@angular/animations';

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

  constructor(
    injector: Injector,
    private fb: FormBuilder
  ) {
    super(injector);
    this.documentsForm = this.fb.group({
      documents: this.fb.array([])
    });

    // Update total price whenever form changes
    this.documentsForm.valueChanges.subscribe(value => {
      this.calculateTotalPrice();
      this.updateParentModel({ documents: value.documents }, this.checkParentValidator());
    });
  }

  ngOnInit(): void {
    if (this.defaultValues?.documents?.length) {
      this.loadDocuments(this.defaultValues.documents);
    } else {
      this.addDocument();
    }
  }

  get documents(): FormArray {
    return this.documentsForm.get('documents') as FormArray;
  }

  private createDocument(): FormGroup {
    return this.fb.group({
      file_name: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      file: [null],
      filePreview: [''],
      fileIcon: ['']
    });
  }

  addDocument(): void {
    this.documents.push(this.createDocument());
  }

  removeDocument(index: number): void {
    this.documents.removeAt(index);
  }

  triggerFileInput(index: number): void {
    document.getElementById('fileInput' + index)?.click();
  }

  onFileSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      const docGroup = this.documents.at(index);
      docGroup.patchValue({
        file: file,
        filePreview: true,
        fileIcon: this.getFileIconByExtension(file.name)
      });
    }
  }

  private loadDocuments(documents: any[]): void {
    this.documents.clear();
    documents.forEach(doc => {
      const docGroup = this.createDocument();
      docGroup.patchValue({
        file_name: doc.file_name,
        price: doc.price,
        file: doc.file,
        filePreview: doc.filePreview,
        fileIcon: this.getFileIconByExtension(doc.file_name)
      });
      this.documents.push(docGroup);
    });
  }

  private getFileIconByExtension(file_name: string): string {
    const extension = file_name.split('.').pop()?.toLowerCase() || '';
    const iconMap: { [key: string]: string } = {
      pdf: './assets/media/svg/new-files/pdf.svg',
      doc: './assets/media/svg/new-files/doc.svg',
      docx: './assets/media/svg/new-files/docx.svg',
      xls: './assets/media/svg/new-files/xls.svg',
      xlsx: './assets/media/svg/new-files/xls.svg',
      ppt: './assets/media/svg/new-files/ppt.svg',
      pptx: './assets/media/svg/new-files/ppt.svg',
      txt: './assets/media/svg/new-files/txt.svg',
      zip: './assets/media/svg/new-files/zip.svg',
      rar: './assets/media/svg/new-files/zip.svg'
    };
    return iconMap[extension] || './assets/media/svg/files/default.svg';
  }

  checkParentValidator(): boolean {
    if (!this.documents.length) {
      return false;
    }

    for (const control of this.documents.controls) {
      const file_name = control.get('file_name')?.value;
      const price = control.get('price')?.value;
      const file = control.get('file')?.value;

      if (!file_name || price === null || price < 0 || !file) {
        return false;
      }
    }

    return true;
  }

  private calculateTotalPrice(): void {
    this.totalPrice = this.documents.controls.reduce((sum, control) => {
      const price = control.get('price')?.value || 0;
      return sum + price;
    }, 0);
  }
}
