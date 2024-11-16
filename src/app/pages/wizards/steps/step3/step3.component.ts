import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ICreateAccount } from '../../create-account.helper';

@Component({
  selector: 'app-step3',
  templateUrl: './step3.component.html',
})
export class Step3Component implements OnInit, OnDestroy {
  @Input('updateParentModel') updateParentModel: (
    part: Partial<ICreateAccount>,
    isFormValid: boolean
  ) => void;
  form: FormGroup;

  @Input() defaultValues: Partial<ICreateAccount>;

  @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>;
  private unsubscribe: Subscription[] = [];

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.initForm();
    this.updateParentModel({}, this.checkForm());
  }

  initForm() {
    this.form = this.fb.group({
      certifications: this.fb.array([]),
    });
    if (this.defaultValues?.certifications) {
      this.defaultValues.certifications.forEach(cert => {
        this.addCertification(cert);
      });
    }
  
    const formChangesSubscr = this.form.valueChanges.subscribe((val) => {
      this.updateParentModel(val, this.checkForm());
    });
    this.unsubscribe.push(formChangesSubscr);
  }

  get certifications(): FormArray {
    return this.form.get('certifications') as FormArray;
  }

  addCertification(cert?: { file: File }) {
    const certForm = this.fb.group({
      file: [cert ? cert.file : null, [Validators.required]],
    });
    this.certifications.push(certForm);
    this.updateParentModel(this.form.value, this.checkForm());
  }

  removeCertification(index: number) {
    this.certifications.removeAt(index);
    this.updateParentModel(this.form.value, this.checkForm());
    this.fileInput.nativeElement.value=''
  }

  onDropzoneClick() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    this.handleFiles(files);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    if(event.dataTransfer){
      const files = event.dataTransfer.files;
      this.handleFiles(files);
    }

  }

  handleFiles(files: FileList) {
    for (let i = 0; i < files.length; i++) {
      const file = files.item(i);
      if(file){
        this.addCertification({ file });
      }
        }
  }

  getFileIcon(file: File) {
    if(file){
    const extension = file?.name?.split('.')?.pop()?.toLowerCase();
    const iconPath = `./assets/media/svg/files/${extension}.svg`;
    // If the icon doesn't exist, return a default icon
    // You might need to implement a check to see if the file exists
    return iconPath;
  }
  }

  checkForm() {
    return this.form.valid;
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}

