import { Component, Injector, OnInit, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { ComponentCanDeactivate } from 'src/app/guards/pending-changes.guard';
import { BaseComponent } from 'src/app/modules/base.component';
import { PaymentService, ManualAccountRequest, UpdateManualAccountRequest, PaymentDetailsResponse, PaymentMethod, TermsResponse } from 'src/app/_fake/services/payment/payment.service';
import { CountriesService, Country } from 'src/app/_fake/services/countries/countries.service';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { PhoneNumberInputComponent } from 'src/app/reusable-components/phone-number-input/phone-number-input.component';

interface ExtendedCountry extends Country {
  showFlag?: boolean;
}

@Component({
  selector: 'app-manual-account',
  templateUrl: './manual-account.component.html',
  styleUrls: ['./manual-account.component.scss']
})
export class ManualAccountComponent extends BaseComponent implements OnInit, AfterViewInit, ComponentCanDeactivate {
  manualAccountForm: FormGroup;
  showValidationErrors: boolean = false;
  isEditing: boolean = false;
  existingData: PaymentMethod | null = null;
  hasExistingManualAccount: boolean = false;
  countries: ExtendedCountry[] = [];
  userRoles: string[] = [];
  isCompanyAccount: boolean = false;
  resendCooldown: number = 0;
  canResendOtp: boolean = true;
  formattedPhoneNumber: string = '';
  selectedCountry: ExtendedCountry | null = null;
  termsAccepted: boolean = false;
  showTermsDialog: boolean = false;
  termsContent: string = '';
  isLoadingTerms: boolean = false;
  initialFormValue: any = null;
  showUnsavedChangesDialog: boolean = false;
  pendingNavigation: () => void = () => {};
  isFormDirtyOnEdit: boolean = false;
  allowNavigationAfterDiscard: boolean = false;
  private navigationResolver: ((value: boolean) => void) | null = null;

  @ViewChild('phoneInput') phoneInput!: PhoneNumberInputComponent;

  constructor(
    injector: Injector,
    private fb: FormBuilder,
    private router: Router,
    public paymentService: PaymentService,
    private countriesService: CountriesService,
    private profileService: ProfileService
  ) {
    super(injector);
    this.manualAccountForm = this.fb.group({
      countryId: ['', [Validators.required]],
      accountName: ['', [Validators.required, Validators.minLength(2)]],
      iban: ['', [Validators.required, Validators.minLength(10)]],
      address: ['', [Validators.required, Validators.minLength(5)]],
      swift_code: [''],
      phoneCountryCode: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required, Validators.minLength(7)]],
      code: ['', [Validators.required, Validators.minLength(4)]],
      termsAccepted: [false, [Validators.requiredTrue]]
    });
  }

  ngOnInit() {
    this.loadUserProfile();
    this.loadCountries();
    this.trackFormChanges();
  }

  ngAfterViewInit() {
    // Update phone input component after data is loaded
    if (this.isEditing && this.phoneInput) {
      setTimeout(() => {
        this.updatePhoneInputDisplay();
      });
    }
  }

  // Track form changes
  private trackFormChanges() {
    this.manualAccountForm.valueChanges.subscribe(() => {
      if (this.isEditing && this.initialFormValue) {
        this.isFormDirtyOnEdit = this.hasFormChanged();
      }
    });
  }

  // Check if form has unsaved changes
  private hasFormChanged(): boolean {
    if (!this.initialFormValue) return false;
    
    const currentValue = this.manualAccountForm.getRawValue();
    const keysToCheck = ['countryId', 'accountName', 'iban', 'address', 'swift_code', 'phoneCountryCode', 'phoneNumber'];
    
    for (const key of keysToCheck) {
      if (currentValue[key] !== this.initialFormValue[key]) {
        return true;
      }
    }
    return false;
  }

  // CanDeactivate implementation
  canDeactivate(): Observable<boolean> | boolean {
    if (this.allowNavigationAfterDiscard) {
      return true;
    }
    if (this.isEditing && this.hasFormChanged()) {
      return new Observable<boolean>(observer => {
        this.navigationResolver = (result: boolean) => {
          observer.next(result);
          observer.complete();
        };
        this.showUnsavedChangesDialog = true;
      });
    }
    return true;
  }

  // Handle browser back/refresh
  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (this.isEditing && this.hasFormChanged()) {
      $event.returnValue = true;
    }
  }

  // Dialog actions
  onStayOnPage() {
    this.showUnsavedChangesDialog = false;
    if (this.navigationResolver) {
      this.navigationResolver(false);
      this.navigationResolver = null;
    }
    // Auto-generate OTP when staying on page
    if (this.canResendOtp) {
      this.resendOtp();
    }
  }

  onDiscardChanges() {
    this.showUnsavedChangesDialog = false;

    // Reset form state to clean state to bypass canDeactivate check
    this.initialFormValue = this.manualAccountForm.getRawValue();
    this.manualAccountForm.markAsPristine();
    this.isFormDirtyOnEdit = false;

    // Resolve the navigation observable to allow navigation to proceed
    if (this.navigationResolver) {
      this.navigationResolver(true);
      this.navigationResolver = null;
    }

    // Also handle any explicit pending navigation (for back button)
    if (this.pendingNavigation) {
      this.pendingNavigation();
      this.pendingNavigation = () => {};
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
        } as ExtendedCountry));
        // Load existing data after countries are loaded
        this.loadExistingData();
      },
      error: (error) => {
        console.error('Error loading countries:', error);
        // Still try to load existing data even if countries fail
        this.loadExistingData();
      }
    });
  }

  loadExistingData() {
    // Always check payment account details to determine if manual account exists
    this.paymentService.getPaymentAccountDetails().subscribe({
      next: (response: PaymentDetailsResponse) => {
        const manualAccount = this.paymentService.getManualAccount(response.data);
        
        // Check if manual account exists in the response
        this.hasExistingManualAccount = manualAccount !== null;
        
        // Check for edit mode
        const urlParams = new URLSearchParams(window.location.search);
        const isEditMode = urlParams.get('edit') === 'true';
        
        if (isEditMode && manualAccount) {
          // Edit mode - populate form with existing data
          this.isEditing = true;
          this.existingData = manualAccount;
          
          // Parse phone number
          let countryCode = '';
          let phoneNumber = '';
          
          if (this.existingData.phone) {
            const phoneMatch = this.existingData.phone.match(/\(\+(\d+)\)(.+)/);
            if (phoneMatch) {
              countryCode = phoneMatch[1];
              phoneNumber = phoneMatch[2];
            }
          }
          
          this.formattedPhoneNumber = this.existingData.phone || '';
          
          // Set selected country
          if (this.existingData.country) {
            this.setSelectedCountry(this.existingData.country);
          }
          
          // Pre-fill form
          const formData = {
            countryId: this.existingData.country?.id || '',
            accountName: this.existingData.account_name || '',
            iban: this.existingData.iban || '',
            address: this.existingData.address || '',
            swift_code: this.existingData.swift_code || '',
            phoneCountryCode: countryCode,
            phoneNumber: phoneNumber.replace(/\D/g, ''),
            termsAccepted: true
          };
          this.manualAccountForm.patchValue(formData);
          
          // Store initial form value after pre-filling
          setTimeout(() => {
            this.initialFormValue = this.manualAccountForm.getRawValue();
            this.manualAccountForm.markAsPristine();
            this.updatePhoneInputDisplay();
          });
        } else if (manualAccount?.country) {
          // Not in edit mode but manual account exists - set country from existing data
          this.setSelectedCountry(manualAccount.country);
          this.manualAccountForm.patchValue({ countryId: manualAccount.country.id });
        }
        
        // Load terms for new accounts (not in edit mode)
        if (!isEditMode) {
          this.loadManualPaymentTerms();
        }
      },
      error: () => {
        console.log('No existing payment details');
        this.hasExistingManualAccount = false;
        this.isEditing = false;
        // Load terms for new accounts
        this.loadManualPaymentTerms();
      }
    });
  }

  private setSelectedCountry(countryData: any) {
    // Find the matching country from the full countries list
    const matchingCountry = this.countries.find(c => c.id === countryData.id);
    if (matchingCountry) {
      this.selectedCountry = matchingCountry;
    } else {
      // If country not found in the full list, create from API data
      this.selectedCountry = {
        ...countryData,
        region_id: 0,
        iso2: '',
        iso3: '',
        nationality: '',
        nationalities: { en: '', ar: '' },
        international_code: '',
        names: { en: countryData.name, ar: countryData.name },
        status: 'active',
        showFlag: true
      } as ExtendedCountry;
    }
  }

  onCountryChange(event: any) {
    const selectedCountryId = event.value;
    if (selectedCountryId) {
      this.selectedCountry = this.countries.find(c => c.id === selectedCountryId) || null;
    } else {
      this.selectedCountry = null;
    }
  }

  onSubmit() {
    // Always validate first
    this.showValidationErrors = true;
    this.markFormGroupTouched();
    
    // Check if form has been modified in edit mode only after validation
    if (this.isEditing && !this.hasFormChanged()) {
      this.showInfo(
        this.lang === 'ar' ? 'معلومات' : 'Information',
        this.lang === 'ar' ? 'لم يتم إجراء أي تغييرات' : 'No changes were made'
      );
      return;
    }
    
    if (this.manualAccountForm.valid) {
      const countryId = this.selectedCountry?.id || this.manualAccountForm.value.countryId;
      if (!countryId) {
        this.showError(
          this.lang === 'ar' ? 'خطأ' : 'Error',
          this.lang === 'ar' ? 'يرجى اختيار البلد' : 'Please select a country'
        );
        return;
      }

      if (this.hasExistingManualAccount) {
        // Update existing manual account
        const updateData: UpdateManualAccountRequest = {
          country_id: countryId,
          account_name: this.manualAccountForm.value.accountName,
          iban: this.manualAccountForm.value.iban.replace(/\s+/g, ''),
          address: this.manualAccountForm.value.address,
          swift_code: this.manualAccountForm.value.swift_code,
          phone: this.formattedPhoneNumber || `${this.manualAccountForm.value.phoneCountryCode}${this.manualAccountForm.value.phoneNumber}`,
          code: this.manualAccountForm.value.code
        };

        this.paymentService.updateManualAccount(updateData).subscribe({
          next: () => {
            // Reset form state to prevent unsaved changes dialog
            this.initialFormValue = this.manualAccountForm.getRawValue();
            this.manualAccountForm.markAsPristine();
            this.isFormDirtyOnEdit = false;
            
            this.showSuccess(
              this.lang === 'ar' ? 'تم الحفظ' : 'Success',
              this.lang === 'ar' ? 'تم تحديث الحساب بنجاح' : 'Account updated successfully'
            );
            this.router.navigate(['/app/insighter-dashboard/account-settings/payment-settings']);
          },
          error: (error) => {
            this.handleServerErrors(error);
          }
        });
      } else {
        // Create new manual account
        const createData: ManualAccountRequest = {
          country_id: countryId,
          account_name: this.manualAccountForm.value.accountName,
          iban: this.manualAccountForm.value.iban.replace(/\s+/g, ''),
          address: this.manualAccountForm.value.address,
          swift_code: this.manualAccountForm.value.swift_code,
          phone: this.formattedPhoneNumber || `${this.manualAccountForm.value.phoneCountryCode}${this.manualAccountForm.value.phoneNumber}`,
          code: this.manualAccountForm.value.code,
          accept_terms: this.termsAccepted
        };

        this.paymentService.setManualAccount(createData).subscribe({
          next: () => {
            this.showSuccess(
              this.lang === 'ar' ? 'تم الحفظ' : 'Success',
              this.lang === 'ar' ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully'
            );
            this.router.navigate(['/app/insighter-dashboard/account-settings/payment-settings']);
          },
          error: (error) => {
            this.handleServerErrors(error);
          }
        });
      }
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.manualAccountForm.controls).forEach(key => {
      const control = this.manualAccountForm.get(key);
      control?.markAsTouched();
      control?.markAsDirty();
    });
  }

  goBack() {
    if (this.isEditing && this.hasFormChanged()) {
      this.showUnsavedChangesDialog = true;
      this.pendingNavigation = () => {
        this.router.navigate(['/app/insighter-dashboard/account-settings/payment-settings']);
      };
    } else {
      if (this.isEditing) {
        this.router.navigate(['/app/insighter-dashboard/account-settings/payment-settings']);
      } else {
        this.router.navigate(['/setup-payment-info']);
      }
    }
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

    this.paymentService.generatePaymentOTP().subscribe({
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


  getFlagUrl(flagName: string): string {
    return `assets/media/flags/${flagName}.svg`;
  }

  // Terms and conditions methods
  openTermsDialog() {
    this.showTermsDialog = true;
  }

  closeTermsDialog() {
    this.showTermsDialog = false;
  }

  acceptTerms() {
    this.termsAccepted = true;
    this.manualAccountForm.patchValue({ termsAccepted: true });
    this.closeTermsDialog();
  }

  declineTerms() {
    this.termsAccepted = false;
    this.manualAccountForm.patchValue({ termsAccepted: false });
    this.closeTermsDialog();
  }

  private loadManualPaymentTerms() {
    this.isLoadingTerms = true;
    this.paymentService.getManualPaymentTerms().subscribe({
      next: (response: TermsResponse) => {
        this.termsContent = response.data.guideline;
        this.isLoadingTerms = false;
      },
      error: () => {
        this.isLoadingTerms = false;
      }
    });
  }

  printTerms(): void {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const termsTitle = this.lang === 'ar' ? 'شروط وأحكام محفظة الدفع' : 'Wallet Payment Terms & Conditions';
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${termsTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
            h1 { color: #333; text-align: center; margin-bottom: 20px; }
            .content { margin: 0 auto; max-width: 800px; }
          </style>
        </head>
        <body>
          <h1>${termsTitle}</h1>
          <div class="content">${this.termsContent}</div>
        </body>
        </html>
      `;
      
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  }

  saveTerms(): void {
    if (this.termsContent) {
      const termsTitle = this.lang === 'ar' ? 'شروط-وأحكام-محفظة-الدفع' : 'Wallet-Payment-Terms-and-Conditions';
      const termsText = this.stripHtmlTags(this.termsContent);
      
      const blob = new Blob([termsText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${termsTitle}.txt`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  }

  private stripHtmlTags(html: string): string {
    const tempElement = document.createElement('div');
    tempElement.innerHTML = html;
    return tempElement.textContent || tempElement.innerText || '';
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
      if (control.errors['required'] || control.errors['requiredTrue']) {
        if (fieldName === 'termsAccepted') {
          return this.lang === 'ar' 
            ? 'يجب الموافقة على الشروط والأحكام' 
            : 'You must agree to the Terms & Conditions';
        }
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
      countryId: { en: 'Country', ar: 'البلد' },
      accountName: this.isCompanyAccount 
        ? { en: 'Company Legal Name', ar: 'الاسم القانوني للشركة' }
        : { en: 'Full Name', ar: 'الاسم الكامل' },
      iban: { en: 'IBAN', ar: 'رقم الآيبان' },
      address: { en: 'Address', ar: 'العنوان' },
      swift_code: { en: 'SWIFT Code', ar: 'رمز السويفت' },
      phoneCountryCode: { en: 'Country Code', ar: 'رمز البلد' },
      phoneNumber: { en: 'Phone Number', ar: 'رقم الهاتف' },
      code: { en: 'Verification Code', ar: 'رمز التحقق' },
      termsAccepted: { en: 'Terms & Conditions', ar: 'الشروط والأحكام' }
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