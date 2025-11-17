import { Component, Injector, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseComponent } from 'src/app/modules/base.component';
import { PaymentService, StripeCountry, PaymentMethod, StripeAccountRequest, PaymentDetailsResponse } from 'src/app/_fake/services/payment/payment.service';
import { PaymentCountryService } from 'src/app/_fake/services/payment/payment-country.service';
import { GuidelinesService } from 'src/app/_fake/services/guidelines/guidelines.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { OtpModalConfig } from 'src/app/reusable-components/otp-modal/otp-modal.component';

@Component({
  selector: 'app-setup-payment-info',
  templateUrl: './setup-payment-info.component.html',
  styleUrls: ['./setup-payment-info.component.scss']
})
export class SetupPaymentInfoComponent extends BaseComponent implements OnInit {
  paymentForm: FormGroup;
  paymentTypes = [
    {
      id: 'manual',
      name: { en: 'Bank Transfer', ar: 'إعداد حساب بنكي' },
      description: { 
        en: 'Direct transfers to your bank account with manual verification and processing.', 
        ar: 'إعداد التحويلات البنكية المباشرة مع التحقق والمعالجة اليدوية' 
      },
      imageUrl: 'https://res.cloudinary.com/dsiku9ipv/image/upload/v1755933067/bank-account_18410123_jbdogp.png'
    },
    {
      id: 'provider', 
      name: { en: 'Stripe Provider', ar: "مزود سترايب" },
      description: { 
        en: 'Automated payment processing with instant transfers via Stripe platform', 
        ar: 'معالجة المدفوعات الآلية مع التحويلات الفورية عبر منصة سترايب' 
      },
      imageUrl: 'https://res.cloudinary.com/dsiku9ipv/image/upload/v1754902439/New_Project_12_jmtvd6.png'
    }
  ];

  selectedPaymentType: string = '';
  selectedCountry: StripeCountry | null = null;
  allCountries: any[] = [];
  stripeCountries: StripeCountry[] = [];
  filteredCountries: StripeCountry[] = [];
  searchTerm: string = '';
  termsAgreed: boolean = false;
  showValidationErrors: boolean = false;
  stripeTermsContent: string = '';
  isLoadingTerms: boolean = false;
  
  // Payment status properties
  paymentInfo: any = null;
  isEditing: boolean = false;
  isLoadingPaymentInfo: boolean = true;
  isCreatingStripeAccount: boolean = false;
  
  // New properties for payment accounts status
  existingManualAccount: PaymentMethod | null = null;
  existingProviderAccount: PaymentMethod | null = null;
  showManualEdit: boolean = false;
  showProviderDelete: boolean = false;
  isProviderUnderReview: boolean = false;

  // Terms & Conditions properties
  showTermsDialog: boolean = false;
  
  // OTP properties
  showOtpDialog: boolean = false;
  otpCode: string = '';
  resendCooldown: number = 0;
  canResendOtp: boolean = true;
  isSubmittingOtp: boolean = false;
  isOtpForLinkAccount: boolean = false;
  isWaitingForRedirect: boolean = false;
  isResendingOtp: boolean = false;
  otpModalConfig: OtpModalConfig = {
    headerTitle: '',
    redirectMessage: '',
    autoGenerateOnOpen: true
  };

  constructor(
    injector: Injector,
    private fb: FormBuilder,
    private router: Router,
    public paymentService: PaymentService,
    private paymentCountryService: PaymentCountryService,
    private guidelinesService: GuidelinesService,
    private http: HttpClient
  ) {
    super(injector);
    this.paymentForm = this.fb.group({
      paymentType: ['', Validators.required],
      country: [''],
      termsAgreed: [false]
    });
  }

  ngOnInit() {
    this.loadExistingPaymentInfo();
  }

  loadStripeCountries() {
    this.paymentService.getStripeCountries().subscribe({
      next: (countries) => {
        this.stripeCountries = countries.map(country => ({
          ...country,
          showFlag: true
        }));
        this.filteredCountries = [...this.stripeCountries];
      },
      error: (error) => {
        console.error('Error loading Stripe countries:', error);
      }
    });
  }

  onPaymentTypeChange(type: string) {
    this.selectedPaymentType = type;
    this.paymentForm.patchValue({ paymentType: type });
    
    // Load Stripe countries and terms only when provider is selected
    if (type === 'provider') {
      this.loadStripeCountries();
      this.loadStripeTerms();
      // Make country and terms required for provider
      this.paymentForm.get('country')?.setValidators([Validators.required]);
      this.paymentForm.get('termsAgreed')?.setValidators([Validators.requiredTrue]); // Terms are required for provider
    } else {
      // Clear country selection and remove validators for manual
      this.selectedCountry = null;
      this.stripeCountries = [];
      this.filteredCountries = [];
      this.termsAgreed = false;
      this.stripeTermsContent = '';
      this.paymentForm.get('country')?.clearValidators();
      this.paymentForm.get('termsAgreed')?.clearValidators(); // Terms are not required for manual here
      this.paymentForm.patchValue({ country: '', termsAgreed: false });
    }
    this.paymentForm.get('country')?.updateValueAndValidity();
    this.paymentForm.get('termsAgreed')?.updateValueAndValidity();
  }

  selectCountry(country: StripeCountry) {
    this.selectedCountry = country;
    this.paymentCountryService.setCountryId(country.id);
    this.paymentForm.patchValue({ country: country.id });
  }

  unselectCountry() {
    this.selectedCountry = null;
    this.paymentForm.patchValue({ country: '' });
    this.searchTerm = '';
    this.filterCountries();
  }

  filterCountries() {
    if (!this.searchTerm) {
      this.filteredCountries = [...this.stripeCountries];
      return;
    }

    this.filteredCountries = this.stripeCountries.filter(country => {
      const name = country.name.toLowerCase();
      return name.includes(this.searchTerm.toLowerCase());
    });
  }

  getCountryName(country: StripeCountry): string {
    return country.name;
  }

  getFlagUrl(flagName: string): string {
    return `assets/media/flags/${flagName}.svg`;
  }

  onNext() {
    this.showValidationErrors = true; // Ensure validation errors are shown on submit
    this.paymentForm.get('paymentType')?.markAsTouched();
    this.paymentForm.get('country')?.markAsTouched();
    this.paymentForm.get('termsAgreed')?.markAsTouched();

    // Specific validation checks
    if (!this.selectedPaymentType) {
      this.showError(
        this.lang === 'ar' ? 'خطأ في التحقق' : 'Validation Error',
        this.lang === 'ar' ? 'يرجى اختيار نوع الدفع' : 'Please select a payment type'
      );
      return;
    }

    if (this.selectedPaymentType === 'provider') {
      if (!this.selectedCountry) {
        this.showError(
          this.lang === 'ar' ? 'خطأ في التحقق' : 'Validation Error',
          this.lang === 'ar' ? 'يرجى اختيار البلد' : 'Please select a country'
        );
        return;
      }

      if (!this.paymentForm.get('termsAgreed')?.value) {
        this.showError(
          this.lang === 'ar' ? 'خطأ في التحقق' : 'Validation Error',
          this.lang === 'ar' ? 'يجب الموافقة على شروط وأحكام الاتفاقية' : 'You must agree to the Terms & Conditions'
        );
        return;
      }
    }

    // Skip form validation for manual payments as they don't require additional fields
    if (this.selectedPaymentType === 'provider' && this.paymentForm.invalid) {
      this.showError(
        this.lang === 'ar' ? 'خطأ في التحقق' : 'Validation Error',
        this.lang === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields'
      );
      return;
    }

    // Check if selected payment type is disabled
    const isManualDisabled = this.selectedPaymentType === 'manual' && this.existingManualAccount?.status === 'active';
    const isProviderDisabled = this.selectedPaymentType === 'provider' && this.existingProviderAccount && this.existingProviderAccount.details_submitted_at !== null;
    
    if (isManualDisabled || isProviderDisabled) {
      this.showError(
        this.lang === 'ar' ? 'خيار غير متاح' : 'Option Not Available',
        this.lang === 'ar' ? 'هذا الخيار غير متاح حاليًا. يرجى اختيار خيار آخر.' : 'This option is currently not available. Please choose another option.'
      );
      return;
    }

    if (this.selectedPaymentType === 'manual') {
      this.router.navigate(['/app/setup-payment-info/manual-account']);
    } else if (this.selectedPaymentType === 'provider') {
      // For Stripe provider, show OTP dialog first
      this.otpModalConfig.headerTitle = this.lang === 'ar' ? 'تحقق من حساب Stripe' : 'Stripe Account Verification';
      this.otpModalConfig.redirectMessage = this.lang === 'ar' ? 'جاري التوجيه إلى Stripe...' : 'Redirecting to Stripe...';
      this.showOtpDialog = true;
    }
  }

  private initiateStripeOnboarding() {
    // First check account details to see if primary account type is stripe
    this.paymentService.getPaymentAccountDetails().subscribe({
      next: (response) => {
        const providerAccount = this.paymentService.getProviderAccount(response.data);
        
        if (providerAccount?.type === 'provider') {
          // Check if we have a provider account with stripe_account
          const stripeAccount = providerAccount?.stripe_account;
          if (stripeAccount === true && !providerAccount.details_submitted_at) {
            // Can use link account API
            this.isOtpForLinkAccount = true;
          } else {
            // Need to create stripe account first
            this.isOtpForLinkAccount = false;
          }
        } else {
          // For new setup, always assume create account initially.
          this.isOtpForLinkAccount = false; 
        }
        
        // Show OTP dialog
        this.showOtpDialog = true;
      },
      error: (error) => {
        // Fallback to create account if account details not available
        this.isOtpForLinkAccount = false;
        this.showOtpDialog = true;
      }
    });
  }
  
  private createStripeAccountWithOtp(code: string) {
    this.isSubmittingOtp = true;
    const countryId = this.selectedCountry?.id;
    if (!countryId) {
      this.showError(
        this.lang === 'ar' ? 'خطأ' : 'Error',
        this.lang === 'ar' ? 'يرجى اختيار البلد' : 'Please select a country'
      );
      this.isSubmittingOtp = false;
      return;
    }
    
    const request: StripeAccountRequest = { country_id: countryId, code, accept_terms: true };
    this.paymentService.createStripeAccount(request).subscribe({
      next: (response) => {
        this.isSubmittingOtp = false;
        this.showOtpDialog = false;
        if (response.data.stripe_account_link.url) {
          this.showSuccess(
            this.lang === 'ar' ? 'تم التحقق بنجاح' : 'Successfully Verified',
            this.lang === 'ar' ? 'سيتم توجيهك إلى Stripe لإكمال الإعداد' : 'Redirecting to Stripe to complete setup'
          );
          this.isWaitingForRedirect = true;
          // Small delay to show success message before redirect
          window.location.href = response.data.stripe_account_link.url;
       
        } else {
          this.showError(
            this.lang === 'ar' ? 'حدث خطأ' : 'Error',
            this.lang === 'ar' ? 'لم يتم العثور على رابط Stripe' : 'Stripe link not found'
          );
        }
      },
      error: (error) => {
        this.isSubmittingOtp = false;
        // Handle specific case of existing Stripe account (422 error)
        if (error.status === 422 && error.error && error.error.message === "Stripe account exists") {
          this.showOtpDialog = false;
          this.router.navigate(['/app/setup-payment-info/stripe-callback/refresh']);
          return;
        }
        this.handleServerErrors(error);
      }
    });
  }

  private linkStripeAccountWithOtp(code: string) {
    this.isSubmittingOtp = true;
    // Get country from existing provider account
    const countryId = this.existingProviderAccount?.country?.id;
    if (!countryId) {
      this.showError(
        this.lang === 'ar' ? 'خطأ' : 'Error',
        this.lang === 'ar' ? 'لم يتم العثور على معلومات البلد' : 'Country information not found'
      );
      this.isSubmittingOtp = false;
      return;
    }
    
    const request: StripeAccountRequest = { country_id: countryId, code, accept_terms: true };
    this.paymentService.linkStripeAccount(request).subscribe({
      next: (response: any) => {
        this.isSubmittingOtp = false;
        this.showOtpDialog = false;
        if (response.data.stripe_account_link.url) {
          this.showSuccess(
            this.lang === 'ar' ? 'تم التحقق بنجاح' : 'Successfully Verified',
            this.lang === 'ar' ? 'سيتم توجيهك إلى Stripe لإكمال الإعداد' : 'Redirecting to Stripe to complete setup'
          );
          this.isWaitingForRedirect = true;
          // Small delay to show success message before redirect
          window.location.href = response.data.stripe_account_link.url;
        } else {
          this.showError(
            this.lang === 'ar' ? 'حدث خطأ' : 'Error',
            this.lang === 'ar' ? 'لم يتم العثور على رابط Stripe' : 'Stripe link not found'
          );
        }
      },
      error: (error) => {
        this.isSubmittingOtp = false;
        this.handleServerErrors(error);
      }
    });
  }

  loadExistingPaymentInfo() {
    this.isLoadingPaymentInfo = true;
    // Try to load payment details to check if user has existing setup
    this.paymentService.getPaymentAccountDetails().subscribe({
      next: (response: PaymentDetailsResponse) => {
        const primaryAccount = this.paymentService.getPrimaryAccount(response.data);
        if (primaryAccount) {
          this.paymentInfo = primaryAccount;
          
          this.existingManualAccount = this.paymentService.getManualAccount(response.data);
          this.existingProviderAccount = this.paymentService.getProviderAccount(response.data);
          
          this.showManualEdit = this.existingManualAccount !== null && this.existingManualAccount.status === 'active';
          this.showProviderDelete = this.existingProviderAccount !== null; // Always show delete if provider exists
          this.isProviderUnderReview = this.existingProviderAccount?.status === 'inactive' && this.existingProviderAccount?.details_submitted_at !== null;
          
          this.preSelectExistingInfo(); // Reintroduce this call

        } else {
          this.existingManualAccount = null;
          this.existingProviderAccount = null;
          this.showManualEdit = false;
          this.showProviderDelete = false;
          this.isProviderUnderReview = false;
        }
        this.isLoadingPaymentInfo = false;
      },
      error: (error) => {
        // No existing payment setup found - this is fine
        this.existingManualAccount = null;
        this.existingProviderAccount = null;
        this.showManualEdit = false;
        this.showProviderDelete = false;
        this.isProviderUnderReview = false;
        this.isLoadingPaymentInfo = false;
      }
    });
  }

  preSelectExistingInfo() {
    if (this.paymentInfo) {
      // Don't pre-select disabled options
      const isManualDisabled = this.paymentInfo.type === 'manual' && this.existingManualAccount?.status === 'active';
      const isProviderDisabled = this.paymentInfo.type === 'provider' && this.existingProviderAccount && this.existingProviderAccount.details_submitted_at !== null;
      
      if (!isManualDisabled && !isProviderDisabled) {
        this.selectedPaymentType = this.paymentInfo.type;
        this.paymentForm.patchValue({ paymentType: this.paymentInfo.type });
      }
    }
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

  // Generate OTP for Stripe account setup
  generateOtp() {
    this.paymentService.generatePaymentOTP().subscribe({
      next: (response) => {
        this.showSuccess(
          this.lang === 'ar' ? 'تم الإرسال بنجاح' : 'Successfully Sent',
          this.lang === 'ar' ? 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' : 'Verification code sent to your email'
        );
      },
      error: (error) => {
        this.handleServerErrors(error);
      }
    });
  }

  // OTP Modal event handlers
  onOtpSubmit(otpCode: string) {
    this.processStripeAccountWithOtp(otpCode);
  }

  onOtpResend() {
    this.resendOtp();
  }

  onOtpCancel() {
    this.showOtpDialog = false;
    this.otpCode = '';
  }

  onOtpClose() {
    this.showOtpDialog = false;
    this.otpCode = '';
  }

  // Process Stripe account creation/linking based on API logic
  private processStripeAccountWithOtp(code: string) {
    this.isSubmittingOtp = true;
    
    // First check payment account details
    this.paymentService.getPaymentAccountDetails().subscribe({
      next: (response: PaymentDetailsResponse) => {
        const providerAccount = this.paymentService.getProviderAccount(response.data);
        
        if (!providerAccount) {
          // No provider account exists - create new one
          this.createStripeAccountWithOtp(code);
        } else {
          // Provider account exists - check stripe_account status
          if (providerAccount.stripe_account === true) {
            // Call link method
            this.linkStripeAccountWithOtp(code);
          } else {
            // Call create method
            this.createStripeAccountWithOtp(code);
          }
        }
      },
      error: (error) => {
        // If 404 or no account details, create new account
        this.createStripeAccountWithOtp(code);
      }
    });
  }
  
  resendOtp() {
    if (!this.canResendOtp || this.isResendingOtp) return;

    this.isResendingOtp = true;
    this.paymentService.generatePaymentOTP().subscribe({
      next: (response: any) => {
        this.isResendingOtp = false;
        this.showSuccess(
          this.lang === 'ar' ? 'تم الإرسال بنجاح' : 'Successfully Sent',
          this.lang === 'ar' ? 'تم إرسال رمز التحقق الجديد إلى بريدك الإلكتروني' : 'New verification code sent to your email'
        );
        this.startCooldown();
      },
      error: (error) => {
        this.isResendingOtp = false;
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

  public navigateToManualAccount(): void {
    this.router.navigate(['/app/setup-payment-info/manual-account']);
  }

  deleteManualAccount() {
    if (confirm(this.lang === 'ar' ? 'هل أنت متأكد أنك تريد حذف حسابك البنكي اليدوي؟' : 'Are you sure you want to delete your manual bank account?')) {
      this.paymentService.deleteManualAccount().subscribe({
        next: () => {
          this.showSuccess(
            this.lang === 'ar' ? 'تم الحذف بنجاح' : 'Successfully Deleted',
            this.lang === 'ar' ? 'تم حذف حسابك البنكي اليدوي بنجاح' : 'Your manual bank account has been deleted successfully'
          );
          this.loadExistingPaymentInfo(); // Reload to update UI
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      });
    }
  }

  deleteProviderAccount() {
    if (confirm(this.lang === 'ar' ? 'هل أنت متأكد أنك تريد حذف حساب Stripe الخاص بك؟' : 'Are you sure you want to delete your Stripe account?')) {
      this.paymentService.deleteStripeAccount().subscribe({
        next: () => {
          this.showSuccess(
            this.lang === 'ar' ? 'تم الحذف بنجاح' : 'Successfully Deleted',
            this.lang === 'ar' ? 'تم حذف حساب Stripe الخاص بك بنجاح' : 'Your Stripe account has been deleted successfully'
          );
          this.loadExistingPaymentInfo(); // Reload to update UI
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      });
    }
  }

  // Terms & Conditions methods
  openTermsDialog() {
    console.log('Opening Terms Dialog'); // Debug log
    this.showTermsDialog = true;
    this.loadTermsAndConditions();
  }

  closeTermsDialog() {
    this.showTermsDialog = false;
  }

  acceptTerms() {
    this.termsAgreed = true;
    this.paymentForm.patchValue({ termsAgreed: true });
    this.closeTermsDialog();
  }

  declineTerms() {
    this.termsAgreed = false;
    this.paymentForm.patchValue({ termsAgreed: false });
    this.closeTermsDialog();
  }

  onTermsChange(event: any) {
    this.termsAgreed = event.target.checked;
  }

  private loadTermsAndConditions() {
    this.isLoadingTerms = true;
    this.stripeTermsContent = '';

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Language': this.lang || 'en',
      'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    this.http.get<any>('https://api.foresigha.co/api/common/setting/guideline/slug/stripe-payment-terms-and-conditions', { headers })
      .subscribe({
        next: (response) => {
          this.isLoadingTerms = false;
          if (response && response.data && response.data.guideline) {
            this.stripeTermsContent = response.data.guideline;
          } else {
            this.showError(
              this.lang === 'ar' ? 'خطأ' : 'Error',
              this.lang === 'ar' ? 'لا يمكن تحميل الشروط والأحكام' : 'Unable to load Terms & Conditions'
            );
          }
        },
        error: (error) => {
          this.isLoadingTerms = false;
          this.showError(
            this.lang === 'ar' ? 'خطأ' : 'Error',
            this.lang === 'ar' ? 'فشل في تحميل الشروط والأحكام' : 'Failed to load Terms & Conditions'
          );
        }
      });
  }

  printTerms(): void {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const termsTitle = this.lang === 'ar' ? 'شروط وأحكام الاتفاقية' : 'Terms & Conditions';
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
          <div class="content">${this.stripeTermsContent}</div>
        </body>
        </html>
      `;
      
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      this.showError(
        this.lang === 'ar' ? 'خطأ' : 'Error',
        this.lang === 'ar' ? 'لا يمكن فتح نافذة الطباعة. يرجى التحقق من إعدادات المتصفح.' : 'Could not open print window. Please check your browser settings.'
      );
    }
  }

  saveTerms(): void {
    if (this.stripeTermsContent) {
      const termsTitle = this.lang === 'ar' ? 'شروط-وأحكام-الاتفاقية' : 'Terms-and-Conditions';
      const termsText = this.stripHtmlTags(this.stripeTermsContent);
      
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

  loadStripeTerms() {
    this.isLoadingTerms = true;
    this.paymentService.getStripePaymentTerms().subscribe({
      next: (terms: any) => {
        this.stripeTermsContent = terms?.data?.guideline || '';
        this.isLoadingTerms = false;
      },
      error: (error: any) => {
        console.error('Error loading Stripe terms:', error);
        this.isLoadingTerms = false;
      }
    });
  }

  get allPaymentOptionsExist(): boolean | null {
    const hasManualActive = this.existingManualAccount?.status === 'active';
    const hasProviderComplete = this.existingProviderAccount && this.existingProviderAccount.details_submitted_at !== null;
    return hasManualActive && hasProviderComplete;
  }
}