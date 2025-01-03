import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ICreateKnowldege } from '../../create-account.helper';

@Component({
  selector: 'app-step4',
  templateUrl: './step4.component.html',
})
export class Step4Component implements OnInit, OnDestroy {
  @Input('updateParentModel') updateParentModel: (
    part: Partial<ICreateKnowldege>,
    isFormValid: boolean
  ) => void;
  form: FormGroup;
  @Input() defaultValues: Partial<ICreateKnowldege>;

  private unsubscribe: Subscription[] = [];

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.initForm();
    this.updateParentModel({}, this.checkForm());
  }

  initForm() {
    this.form = this.fb.group({
      nameOnCard: ['', [Validators.required]],
      cardNumber: [ , [Validators.required]],
      cardExpiryMonth: [
     '',
        [Validators.required],
      ],
      cardExpiryYear: [
      '',
        [Validators.required],
      ],
      cardCvv: ['', [Validators.required]],
      saveCard: ['1'],
    });

    const formChangesSubscr = this.form.valueChanges.subscribe((val) => {
      this.updateParentModel(val, this.checkForm());
    });
    this.unsubscribe.push(formChangesSubscr);
  }

  checkForm() {
    return !(
      this.form.get('nameOnCard')?.hasError('required') ||
      this.form.get('cardNumber')?.hasError('required') ||
      this.form.get('cardExpiryMonth')?.hasError('required') ||
      this.form.get('cardExpiryYear')?.hasError('required') ||
      this.form.get('cardCvv')?.hasError('required')
    );
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
