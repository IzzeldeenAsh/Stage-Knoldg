import { Component, Injector, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseComponent } from 'src/app/modules/base.component';
import { PaymentService, StripeCountry } from 'src/app/_fake/services/payment/payment.service';
import { CountriesService, Country } from 'src/app/_fake/services/countries/countries.service';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

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
      name: { en: 'Bank Account Setup', ar: 'إعداد حساب بنكي' },
      description: { 
        en: 'Set up direct bank transfers with manual verification and processing', 
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

  selectedPaymentType: string | null = null;
  allCountries: Country[] = [];
  stripeCountries: StripeCountry[] = [];
  filteredCountries: any[] = [];
  searchTerm: string = '';
  selectedCountry: any = null;
  showValidationErrors: boolean = false;
  
  // Payment status properties
  paymentInfo: any = null;
  hasExistingPayment: boolean = false;
  isEditing: boolean = false;
  isLoadingPaymentInfo: boolean = true;
  isCreatingStripeAccount: boolean = false;
  
  // Terms & Conditions properties
  termsAgreed: boolean = false;
  showTermsDialog: boolean = false;
  termsContent: string = '';
  isLoadingTerms: boolean = false;
  
  // OTP properties
  showOtpDialog: boolean = false;
  otpCode: string = '';
  resendCooldown: number = 0;
  canResendOtp: boolean = true;
  isSubmittingOtp: boolean = false;
  isOtpForLinkAccount: boolean = false;
  isWaitingForRedirect: boolean = false;

  // Stripe onboarding status
  stripeOnboardingStatus: any = null;

  constructor(
    injector: Injector,
    private fb: FormBuilder,
    private router: Router,
    public paymentService: PaymentService,
    private countriesService: CountriesService,
    private http: HttpClient
  ) {
    super(injector);
    this.paymentForm = this.fb.group({
      paymentType: ['', Validators.required],
      countryId: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadAllCountries();
    this.loadExistingPaymentInfo();
  }

  loadAllCountries() {
    this.countriesService.getCountries().subscribe({
      next: (countries) => {
        this.allCountries = countries;
      },
      error: (error) => {
        this.handleServerErrors(error);
      }
    });
  }

  loadStripeCountries() {
    this.paymentService.getStripeCountries().subscribe({
      next: (countries) => {
        this.stripeCountries = countries;
        this.filteredCountries = [...this.stripeCountries];
      },
      error: (error) => {
        this.handleServerErrors(error);
      }
    });
  }

  selectPaymentType(type: string) {
    this.selectedPaymentType = type;
    this.paymentForm.patchValue({ paymentType: type });
    this.selectedCountry = null;
    this.paymentForm.patchValue({ countryId: '' });
    
    if (type === 'provider') {
      this.loadStripeCountries();
      this.checkStripeOnboardingStatus();
    } else {
      this.filteredCountries = [...this.allCountries];
    }
    
    this.filterCountries();
  }

  selectCountry(country: any) {
    this.selectedCountry = country;
    this.paymentForm.patchValue({ countryId: country.id });
  }

  unselectCountry() {
    this.selectedCountry = null;
    this.paymentForm.patchValue({ countryId: '' });
    this.searchTerm = '';
    this.filterCountries();
  }

  filterCountries() {
    if (!this.searchTerm) {
      this.filteredCountries = this.selectedPaymentType === 'provider' 
        ? [...this.stripeCountries] 
        : [...this.allCountries];
      return;
    }

    const countries = this.selectedPaymentType === 'provider' ? this.stripeCountries : this.allCountries;
    this.filteredCountries = countries.filter(country => {
      const name = this.getCountryName(country).toLowerCase();
      return name.includes(this.searchTerm.toLowerCase());
    });
  }

  getCountryName(country: any): string {
    if (this.selectedPaymentType === 'provider') {
      return country.name;
    } else {
      return this.lang === 'ar' ? country.names?.ar : country.names?.en;
    }
  }

  getFlagUrl(flagName: string): string {
    return `assets/media/flags/${flagName}.svg`;
  }

  onNext() {
    if (this.paymentForm.valid && this.termsAgreed) {
      const formData = {
        type: this.selectedPaymentType as 'manual' | 'provider',
        country_id: this.selectedCountry.id,
        accept_terms: this.termsAgreed
      };

      this.paymentService.setPaymentType(formData).subscribe({
        next: (response) => {
          this.showSuccess(
            this.lang === 'ar' ? 'تم الحفظ بنجاح' : 'Successfully Saved',
            this.lang === 'ar' ? 'تم حفظ نوع الدفع بنجاح' : 'Payment type saved successfully'
          );
          
          // Navigate to appropriate next step
          if (this.selectedPaymentType === 'manual') {
            this.router.navigate(['/app/setup-payment-info/manual-account']);
          } else if (this.selectedPaymentType === 'provider') {
            this.initiateStripeOnboarding();
          }
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      });
    } else {
      this.showValidationErrors = true;
      
      if (!this.selectedPaymentType) {
        this.showError(
          this.lang === 'ar' ? 'حدث خطأ' : 'Validation Error',
          this.lang === 'ar' ? 'يرجى اختيار نوع الدفع' : 'Please select a payment type'
        );
      } else if (!this.selectedCountry) {
        this.showError(
          this.lang === 'ar' ? 'حدث خطأ' : 'Validation Error',
          this.lang === 'ar' ? 'يرجى اختيار الدولة' : 'Please select a country'
        );
      } else if (!this.termsAgreed) {
        this.showError(
          this.lang === 'ar' ? 'حدث خطأ' : 'Validation Error',
          this.lang === 'ar' ? 'يجب الموافقة على شروط وأحكام الاتفاقية' : 'You must agree to the Terms & Conditions'
        );
      }
    }
  }

  private initiateStripeOnboarding() {
    // First check account details to see if primary account type is stripe
    this.paymentService.getAccountDetails().subscribe({
      next: (response) => {
        if (response?.data?.primary?.type === 'stripe') {
          // Primary account is stripe, check stripe_account boolean in secondary
          const stripeAccount = response.data.secondary?.stripe_account;
          if (stripeAccount === false) {
            // Need to create stripe account first
            this.isOtpForLinkAccount = false;
          } else {
            // Can use link account API
            this.isOtpForLinkAccount = true;
          }
        } else {
          // Check existing onboarding status logic
          if (this.stripeOnboardingStatus && this.stripeOnboardingStatus.account && !this.stripeOnboardingStatus.details_submitted_at) {
            // Use link account API - set flag for OTP dialog
            this.isOtpForLinkAccount = true;
          } else {
            // Use create account API 
            this.isOtpForLinkAccount = false;
          }
        }
        
        // Show OTP dialog
        this.showOtpDialog = true;
      },
      error: (error) => {
        // Fallback to existing logic if account details not available
        if (this.stripeOnboardingStatus && this.stripeOnboardingStatus.account && !this.stripeOnboardingStatus.details_submitted_at) {
          this.isOtpForLinkAccount = true;
        } else {
          this.isOtpForLinkAccount = false;
        }
        this.showOtpDialog = true;
      }
    });
  }
  
  private createStripeAccountWithOtp(code: string) {
    this.isSubmittingOtp = true;
    this.paymentService.createStripeAccount(code).subscribe({
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
    this.paymentService.getStripeLink(code).subscribe({
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
        this.handleServerErrors(error);
      }
    });
  }

  loadExistingPaymentInfo() {
    this.isLoadingPaymentInfo = true;
    // Try to load payment details to check if user has existing setup
    this.paymentService.getAccountDetails().subscribe({
      next: (response) => {
        // Check if response has data - API returns 201 with no data for new accounts
        if (response && response.data && response.data.primary) {
          this.paymentInfo = response.data.primary;
          if(response.data.primary.type === 'manual' && response.data.primary.status === 'inactive'){
            this.hasExistingPayment = false;
          } else {  
            this.hasExistingPayment = true;
          }
          this.preSelectExistingInfo();
        } else {
          this.hasExistingPayment = false;
        }
        this.isLoadingPaymentInfo = false;
      },
      error: (error) => {
        // If status is 201 with no response, consider as new account
        if (error.status === 201) {
          this.hasExistingPayment = false;
        } else {
          // No existing payment setup found - this is fine
          this.hasExistingPayment = false;
        }
        this.isLoadingPaymentInfo = false;
      }
    });
  }

  preSelectExistingInfo() {
    if (this.paymentInfo) {
      this.selectedPaymentType = this.paymentInfo.type;
      this.paymentForm.patchValue({ paymentType: this.paymentInfo.type });
      
      if (this.paymentInfo.country) {
        this.selectedCountry = this.paymentInfo.country;
        this.paymentForm.patchValue({ countryId: this.paymentInfo.country.id });
      }
      
      // Load appropriate countries
      if (this.paymentInfo.type === 'provider') {
        this.loadStripeCountries();
      } else {
        this.filteredCountries = [...this.allCountries];
      }
    }
  }

  onEditManual() {
    this.isEditing = true;
    // Stay on this page to allow country selection, don't navigate to manual-account
  }

  onChangeToStripe() {
    // Reset selected info and show stripe setup
    this.selectedPaymentType = 'provider';
    this.paymentForm.patchValue({ paymentType: 'provider' });
    this.selectedCountry = null;
    this.paymentForm.patchValue({ countryId: '' });
    this.loadStripeCountries();
    this.isEditing = true;
    
    // Check existing Stripe onboarding status
    this.checkStripeOnboardingStatus();
  }

  onChangeToManual() {
    // Reset selected info and show manual setup
    this.selectedPaymentType = 'manual';
    this.paymentForm.patchValue({ paymentType: 'manual' });
    this.selectedCountry = null;
    this.paymentForm.patchValue({ countryId: '' });
    this.filteredCountries = [...this.allCountries];
    this.isEditing = true;
  }

  onCompleteStripe() {
    this.router.navigate(['/app/setup-payment-info/stripe-callback/refresh']);
  }

  onCompleteStripeRedirect() {
    this.isWaitingForRedirect = true;
    // Small delay to show spinner before redirect
    setTimeout(() => {
      this.router.navigate(['/app/setup-payment-info/stripe-callback/refresh']);
    }, 500);
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
    this.closeTermsDialog();
  }

  declineTerms() {
    this.termsAgreed = false;
    this.closeTermsDialog();
  }

  private loadTermsAndConditions() {
    this.isLoadingTerms = true;
    this.termsContent = '';

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Language': this.lang || 'en',
      'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    this.http.get<any>('https://api.knoldg.com/api/common/setting/guideline/slug/payment-terms-and-conditions', { headers })
      .subscribe({
        next: (response) => {
          this.isLoadingTerms = false;
          if (response && response.data && response.data.guideline) {
            this.termsContent = response.data.guideline;
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
    } else {
      this.showError(
        this.lang === 'ar' ? 'خطأ' : 'Error',
        this.lang === 'ar' ? 'لا يمكن فتح نافذة الطباعة. يرجى التحقق من إعدادات المتصفح.' : 'Could not open print window. Please check your browser settings.'
      );
    }
  }

  saveTerms(): void {
    if (this.termsContent) {
      const termsTitle = this.lang === 'ar' ? 'شروط-وأحكام-الاتفاقية' : 'Terms-and-Conditions';
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

  // OTP Dialog methods
  closeOtpDialog() {
    this.showOtpDialog = false;
    this.otpCode = '';
  }
  
  submitOtp() {
    if (this.otpCode.trim().length >= 4) {
      if (this.isOtpForLinkAccount) {
        this.linkStripeAccountWithOtp(this.otpCode.trim());
      } else {
        this.createStripeAccountWithOtp(this.otpCode.trim());
      }
    } else {
      this.showError(
        this.lang === 'ar' ? 'خطأ في التحقق' : 'Verification Error',
        this.lang === 'ar' ? 'يرجى إدخال رمز التحقق' : 'Please enter the verification code'
      );
    }
  }
  
  resendOtp() {
    if (!this.canResendOtp) return;

    this.paymentService.resendOtp().subscribe({
      next: (response) => {
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

  checkStripeOnboardingStatus() {
    this.paymentService.checkStripeOnboardingStatus().subscribe({
      next: (response) => {
        this.stripeOnboardingStatus = response.data;
        
        // Check if account exists but details are not submitted
        if (response.data.account && !response.data.details_submitted_at) {
          // Account exists but not complete - show option to complete
          this.showInfo(
            this.lang === 'ar' ? 'حساب Stripe موجود' : 'Stripe Account Found',
            this.lang === 'ar' ? 'تم العثور على حساب Stripe غير مكتمل. يمكنك إكمال الإعداد.' : 'Found incomplete Stripe account. You can complete the setup.'
          );
        }
      },
      error: (error) => {
        // If 404 or account doesn't exist, that's fine
        if (error.status === 404) {
          this.stripeOnboardingStatus = null;
        } else {
          console.error('Error checking Stripe status:', error);
        }
      }
    });
  }
}