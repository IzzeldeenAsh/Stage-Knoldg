import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { ICreateAccount, inits } from '../create-account.helper';

@Component({
  selector: 'app-vertical',
  templateUrl: './vertical.component.html',
})
export class VerticalComponent implements OnInit, OnDestroy {
  formsCount = 4;
  account$: BehaviorSubject<ICreateAccount> = new BehaviorSubject<ICreateAccount>(inits);
  currentStep$: BehaviorSubject<number> = new BehaviorSubject(1);
  isCurrentFormValid$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  private unsubscribe: Subscription[] = [];

  constructor() {}

  ngOnInit(): void {}

  updateAccount = (part: Partial<ICreateAccount>, isFormValid: boolean) => {
    const currentAccount = this.account$.value;
    const updatedAccount = { ...currentAccount, ...part };
    this.account$.next(updatedAccount);
    this.isCurrentFormValid$.next(isFormValid);
    console.log("updatedAccount",updatedAccount);
  };

  nextStep() {
    const nextStep = this.currentStep$.value + 1;
    if (nextStep > this.formsCount) {
      this.submit()
      return;
    }
    this.currentStep$.next(nextStep);
  }

  prevStep() {
    const prevStep = this.currentStep$.value - 1;
    if (prevStep === 0) {
      return;
    }
    this.currentStep$.next(prevStep);
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }

  submit() {
    const accountData = this.account$.value;
    const formData = new FormData();

    // Append fields to formData
    formData.append('accountType', accountData.accountType);
    formData.append('phone', accountData.phone);

    // accountData.consultingFields.forEach((field, index) => {
    //   formData.append(`consultingFields[${index}]`, field);
    // });

    // accountData.isicCodes.forEach((code, index) => {
    //   formData.append(`isicCodes[${index}]`, code);
    // });

    if (accountData.accountType === 'personal') {
      formData.append('bio', accountData.bio || '');
    } else {
      formData.append('legalName', accountData.legalName || '');
      formData.append('website', accountData.website || '');
      if (accountData.registerDocument) {
        formData.append('registerDocument', accountData.registerDocument);
      }
      formData.append('aboutCompany', accountData.aboutCompany || '');
    }

    if (accountData.certifications && accountData.certifications.length > 0) {
      accountData.certifications.forEach((cert, index) => {
        formData.append(`certifications[${index}][type]`, cert.type);
        formData.append(`certifications[${index}][file]`, cert.file);
      });
    }

    // Submit formData to backend
    // Implement your service method to handle formData
  }
}
