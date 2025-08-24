import { Component, Injector, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseComponent } from 'src/app/modules/base.component';
import { PaymentService, ManualAccountRequest } from 'src/app/_fake/services/payment/payment.service';
import { PaymentCountryService } from 'src/app/_fake/services/payment/payment-country.service';
import { CountriesService, Country } from 'src/app/_fake/services/countries/countries.service';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { PhoneNumberInputComponent } from 'src/app/reusable-components/phone-number-input/phone-number-input.component';

@Component({
  selector: 'app-manual-account',
  templateUrl: './manual-account.component.html',
  styleUrls: ['./manual-account.component.scss']
})
export class ManualAccountComponent extends BaseComponent implements OnInit, AfterViewInit {
  manualAccountForm: FormGroup;
  showValidationErrors: boolean = false;
  isEditing: boolean = false;
  existingData: any = null;
  countries: Country[] = [];
  userRoles: string[] = [];
  isCompanyAccount: boolean = false;
  resendCooldown: number = 0;
  canResendOtp: boolean = true;
  formattedPhoneNumber: string = ''; // Store the formatted phone number

  @ViewChild('phoneInput') phoneInput!: PhoneNumberInputComponent;

  constructor(
    injector: Injector,
    private fb: FormBuilder,
    private router: Router,
    public paymentService: PaymentService,
    private paymentCountryService: PaymentCountryService,
    private countriesService: CountriesService,
    private profileService: ProfileService
  ) {
    super(injector);
    this.manualAccountForm = this.fb.group({
      accountName: ['', [Validators.required, Validators.minLength(2)]],
      iban: ['', [Validators.required, Validators.minLength(10)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      swift_code: [''],
      phoneCountryCode: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required, Validators.minLength(7)]],
      code: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  ngOnInit() {
    this.loadUserProfile();
    this.loadCountries();
    this.loadExistingData();
  }

  ngAfterViewInit() {
    // Update phone input component after data is loaded
    if (this.isEditing && this.phoneInput) {
      setTimeout(() => {
        this.updatePhoneInputDisplay();
      });
    }
  }

  loadUserProfile() {
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.userRoles = profile?.roles || [];
        this.isCompanyAccount = this.userRoles.includes('company');
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
      }
    });
  }

  loadCountries() {
    this.countriesService.getCountries().subscribe({
      next: (countries) => {
        this.countries = countries.map(country => ({
          ...country,
          showFlag: true
        }));
      },
      error: (error) => {
        console.error('Error loading countries:', error);
      }
    });
  }

  loadExistingData() {
    this.paymentService.getManualAccountDetails().subscribe({
      next: (response) => {
        this.existingData = response.data?.primary || response.data;
        this.isEditing = true;
        
        // Parse phone number to extract country code and number
        let countryCode = '';
        let phoneNumber = '';
        
        if (this.existingData.phone) {
          // Parse formatted phone like "(+212)543-534-5353"
          const phoneMatch = this.existingData.phone.match(/\(\+(\d+)\)(.+)/);
          if (phoneMatch) {
            countryCode = phoneMatch[1]; // Extract country code without +
            phoneNumber = phoneMatch[2]; // Extract the formatted number part
          }
        }
        
        // Store the original formatted phone for submission
        this.formattedPhoneNumber = this.existingData.phone || '';
        
        // Pre-fill form with existing data
        this.manualAccountForm.patchValue({
          accountName: this.existingData.account_name || '',
          iban: this.existingData.iban || '',
          address: this.existingData.address || '',
          swift_code: this.existingData.swift_code || '',
          phoneCountryCode: countryCode,
          phoneNumber: phoneNumber.replace(/\D/g, ''), // Clean digits only for form
          code: this.existingData.code || ''
        });

        // Update phone input component after form is patched
        setTimeout(() => {
          this.updatePhoneInputDisplay();
        });
      },
      error: () => {
        // No existing data - this is fine for new setup
        this.isEditing = false;
      }
    });
  }

  onSubmit() {
    if (this.manualAccountForm.valid) {
      const countryId = this.paymentCountryService.getCountryId();
      if (!countryId) {
        this.showError(
          this.lang === 'ar' ? 'خطأ' : 'Error',
          this.lang === 'ar' ? 'يرجى اختيار الدولة من الصفحة السابقة' : 'Please select country from previous page'
        );
        return;
      }

      const formData: ManualAccountRequest = {
        account_name: this.manualAccountForm.value.accountName,
        iban: this.manualAccountForm.value.iban.replace(/\s+/g, ''), // Remove all spaces from IBAN
        address: this.manualAccountForm.value.address,
        swift_code: this.manualAccountForm.value.swift_code,
        phone: this.formattedPhoneNumber || `${this.manualAccountForm.value.phoneCountryCode}${this.manualAccountForm.value.phoneNumber}`,
        code: this.manualAccountForm.value.code,
        country_id: countryId
      };

      this.paymentService.createManualAccount(formData).subscribe({
        next: () => {
          const successMessage = this.isEditing 
            ? (this.lang === 'ar' ? 'تم تحديث الحساب اليدوي بنجاح' : 'Manual account updated successfully')
            : (this.lang === 'ar' ? 'تم إنشاء الحساب اليدوي بنجاح' : 'Manual account created successfully');
          
          this.showSuccess(
            this.lang === 'ar' ? 'تم الحفظ' : 'Success',
            successMessage
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

  onCountryCodeChange(countryCode: string) {
    this.manualAccountForm.get('phoneCountryCode')?.setValue(countryCode);
  }

  onPhoneNumberChange(phoneNumber: string) {
    this.manualAccountForm.get('phoneNumber')?.setValue(phoneNumber);
  }

  onFormattedPhoneNumberChange(formattedPhone: string) {
    this.formattedPhoneNumber = formattedPhone;
  }

  updatePhoneInputDisplay() {
    if (this.phoneInput) {
      const countryCode = this.manualAccountForm.get('phoneCountryCode')?.value;
      const phoneNumber = this.manualAccountForm.get('phoneNumber')?.value;
      
      if (countryCode) {
        this.phoneInput.countryCode = countryCode;
        this.phoneInput.updateMask();
        this.phoneInput.updatePlaceholder();
      }
      
      if (phoneNumber) {
        this.phoneInput.value = phoneNumber;
      }
    }
  }

  onFlagError(country: any) {
    country.showFlag = false;
  }

  resendOtp() {
    if (!this.canResendOtp) return;

    this.paymentService.resendOtp().subscribe({
      next: () => {
        this.showSuccess(
          this.lang === 'ar' ? 'تم الإرسال بنجاح' : 'Successfully Sent',
          this.lang === 'ar' ? 'تم إرسال رمز التحقق الجديد إلى بريدك الإلكتروني' : 'New verification code sent to your email'
        );
        this.startCooldown();
      },
      error: (error) => {
        this.handleServerErrors(error);
      }
    });
  }

  private startCooldown() {
    this.canResendOtp = false;
    this.resendCooldown = 30;
    
    const timer = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        this.canResendOtp = true;
        clearInterval(timer);
      }
    }, 1000);
  }

  getAccountNameLabel(): string {
    if (this.isCompanyAccount) {
      return this.lang === 'ar' ? 'الاسم القانوني للشركة' : 'Company Legal Name';
    } else {
      return this.lang === 'ar' ? 'الاسم الكامل' : 'Full Name';
    }
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
      accountName: this.isCompanyAccount 
        ? { en: 'Company Legal Name', ar: 'الاسم القانوني للشركة' }
        : { en: 'Full Name', ar: 'الاسم الكامل' },
      iban: { en: 'IBAN', ar: 'رقم الآيبان' },
      address: { en: 'Address', ar: 'العنوان' },
      swift_code: { en: 'SWIFT Code', ar: 'رمز السويفت' },
      phoneCountryCode: { en: 'Country Code', ar: 'رمز البلد' },
      phoneNumber: { en: 'Phone Number', ar: 'رقم الهاتف' },
      code: { en: 'Verification Code', ar: 'رمز التحقق' }
    };
    return this.lang === 'ar' ? labels[fieldName].ar : labels[fieldName].en;
  }

  private handleServerErrors(error: any) {
    if (error?.error) {
      // Handle new error format: {"message":"Invalid Code","errors":{"common":["Invalid Code"]}}
      if (error.error.errors) {
        const serverErrors = error.error.errors;
        for (const key in serverErrors) {
          if (serverErrors.hasOwnProperty(key)) {
            const messages = serverErrors[key];
            this.showError(
              this.lang === "ar" ? "حدث خطأ" : "An error occurred",
              Array.isArray(messages) ? messages.join(", ") : messages
            );
          }
        }
      } 
      // Handle simple message format
      else if (error.error.message) {
        this.showError(
          this.lang === "ar" ? "حدث خطأ" : "An error occurred",
          error.error.message
        );
      }
      // Fallback for other error formats
      else {
        this.showError(
          this.lang === "ar" ? "حدث خطأ" : "An error occurred",
          this.lang === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred."
        );
      }
    } else {
      this.showError(
        this.lang === "ar" ? "حدث خطأ" : "An error occurred",
        this.lang === "ar" ? "حدث خطأ غير متوقع" : "An unexpected error occurred."
      );
    }
  }
}