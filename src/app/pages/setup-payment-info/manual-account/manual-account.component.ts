import { Component, Injector, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseComponent } from 'src/app/modules/base.component';
import { PaymentService, ManualAccountRequest } from 'src/app/_fake/services/payment/payment.service';

@Component({
  selector: 'app-manual-account',
  templateUrl: './manual-account.component.html',
  styleUrls: ['./manual-account.component.scss']
})
export class ManualAccountComponent extends BaseComponent implements OnInit {
  manualAccountForm: FormGroup;
  showValidationErrors: boolean = false;

  constructor(
    injector: Injector,
    private fb: FormBuilder,
    private router: Router,
    public paymentService: PaymentService
  ) {
    super(injector);
    this.manualAccountForm = this.fb.group({
      accountName: ['', [Validators.required, Validators.minLength(2)]],
      iban: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit() {}

  onSubmit() {
    if (this.manualAccountForm.valid) {
      const formData: ManualAccountRequest = {
        account_name: this.manualAccountForm.value.accountName,
        iban: this.manualAccountForm.value.iban.replace(/\s+/g, '') // Remove all spaces from IBAN
      };

      this.paymentService.createManualAccount(formData).subscribe({
        next: () => {
          this.showSuccess(
            this.lang === 'ar' ? 'تم الحفظ' : 'Success',
            this.lang === 'ar' ? 'تم إنشاء الحساب اليدوي بنجاح' : 'Manual account created successfully'
          );
          this.router.navigate(['/app/setup-payment-info/success'], { 
            queryParams: { type: 'manual' } 
          });
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      });
    } else {
      this.showValidationErrors = true;
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.manualAccountForm.controls).forEach(key => {
      const control = this.manualAccountForm.get(key);
      control?.markAsTouched();
    });
  }

  goBack() {
    this.router.navigate(['/setup-payment-info']);
  }

  getFieldError(fieldName: string): string {
    const control = this.manualAccountForm.get(fieldName);
    if (control?.errors && (control.dirty || control.touched || this.showValidationErrors)) {
      if (control.errors['required']) {
        return this.lang === 'ar' 
          ? `${this.getFieldLabel(fieldName)} مطلوب` 
          : `${this.getFieldLabel(fieldName)} is required`;
      }
      if (control.errors['minlength']) {
        const minLength = control.errors['minlength'].requiredLength;
        return this.lang === 'ar' 
          ? `${this.getFieldLabel(fieldName)} يجب أن يكون على الأقل ${minLength} أحرف` 
          : `${this.getFieldLabel(fieldName)} must be at least ${minLength} characters`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: { en: string, ar: string } } = {
      accountName: { en: 'Account Name', ar: 'اسم الحساب' },
      iban: { en: 'IBAN', ar: 'رقم الآيبان' }
    };
    return this.lang === 'ar' ? labels[fieldName].ar : labels[fieldName].en;
  }

  private handleServerErrors(error: any) {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          this.showError(
            this.lang === "ar" ? "حدث خطأ" : "An error occurred",
            messages.join(", ")
          );
        }
      }
    } else {
      this.showError(
        this.lang === "ar" ? "حدث خطأ" : "An error occurred",
        this.lang === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred."
      );
    }
  }
}