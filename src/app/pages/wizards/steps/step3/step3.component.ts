import { Component, Input, OnDestroy, OnInit } from '@angular/core';
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

    if (this.defaultValues.certifications && this.defaultValues.certifications.length > 0) {
      this.defaultValues.certifications.forEach((cert) => {
        this.addCertification(cert);
      });
    } else {
      this.addCertification();
    }

    const formChangesSubscr = this.form.valueChanges.subscribe((val) => {
      this.updateParentModel(val, this.checkForm());
    });
    this.unsubscribe.push(formChangesSubscr);
  }

  get certifications(): FormArray {
    return this.form.get('certifications') as FormArray;
  }
  
  addCertification(cert?: { type: string; file: File }) {
    const certForm = this.fb.group({
      type: [cert ? cert.type : '', [Validators.required]],
      file: [cert ? cert.file : null, [Validators.required]],
    });
    this.certifications.push(certForm);
  }

  removeCertification(index: number) {
    this.certifications.removeAt(index);
  }

  onFileChange(event: any, index: number) {
    const file = event.target.files[0];
    if (file) {
      this.certifications.at(index).patchValue({ file: file });
      this.updateParentModel({ certifications: this.form.value.certifications }, this.checkForm());
    }
  }
  checkForm() {
    return this.form.valid;
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
