import { Component, Injector, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BaseComponent } from 'src/app/modules/base.component';
import { PaymentService, PaymentDetailsResponse, PaymentMethod, StripeAccountRequest } from 'src/app/_fake/services/payment/payment.service';
import { PaymentCountryService } from 'src/app/_fake/services/payment/payment-country.service';

@Component({
  selector: 'app-stripe-callback',
  templateUrl: './stripe-callback.component.html',
  styleUrls: ['./stripe-callback.component.scss']
})
export class StripeCallbackComponent extends BaseComponent implements OnInit {
  isLoading: boolean = true;
  isCompleted: boolean = false;
  needsCompletion: boolean = false;
  error: string = '';
  action: string = '';
  
  // Account status
  private stripeAccountExists: boolean | null = null;
  private isRefreshScenario: boolean = false;
  
  // OTP properties
  showOtpDialog: boolean = false;
  otpCode: string = '';
  resendCooldown: number = 0;
  canResendOtp: boolean = true;
  isSubmittingOtp: boolean = false;

  constructor(
    injector: Injector,
    private router: Router,
    private route: ActivatedRoute,
    public paymentService: PaymentService,
    private paymentCountryService: PaymentCountryService
  ) {
    super(injector);
  }

  ngOnInit() {
    this.action = this.route.snapshot.data['action'] || '';
    
    if (this.action === 'return') {
      this.performReturn();
    } else if (this.action === 'refresh') {
      this.performRefresh();
    } else {
      this.performStripeStatusCheck();
    }
  }

  checkStripeStatus() {
    this.isLoading = true;
    this.error = '';
    this.performStripeStatusCheck();
  }

  private performStripeStatusCheck() {
    this.paymentService.getPaymentAccountDetails().subscribe({
      next: (response: PaymentDetailsResponse) => {
        this.isLoading = false;
        
        const providerAccount = this.paymentService.getProviderAccount(response.data);
        this.stripeAccountExists = providerAccount?.stripe_account || false;
        
        if (providerAccount?.details_submitted_at) {
          this.completeStripeOnboarding();
        } else {
          this.needsCompletion = true;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.error = this.lang === 'ar' 
          ? 'حدث خطأ في التحقق من حالة الحساب' 
          : 'Error checking account status';
        this.handleServerErrors(error);
      }
    });
  }

  private completeStripeOnboarding() {
    this.isLoading = true;
    this.paymentService.completeStripeAccount().subscribe({
      next: (response) => {
        this.isLoading = false;
        this.isCompleted = true;
        this.showSuccess(
          this.lang === 'ar' ? 'تم الإكمال بنجاح' : 'Successfully Completed',
          this.lang === 'ar' ? 'تم إعداد حساب Stripe بنجاح وهو جاهز للاستخدام' : 'Stripe account setup completed successfully and ready to use'
        );
        setTimeout(() => {
          this.router.navigate(['/app/setup-payment-info/success'], { queryParams: { type: 'provider' } });
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.needsCompletion = true;
        this.error = this.lang === 'ar' 
          ? 'حدث خطأ في إكمال إعداد الحساب' 
          : 'Error completing account setup';
        this.handleServerErrors(error);
      }
    });
  }

  completeAccount() {
    // Use cached stripe account status if available, otherwise fetch fresh data
    if (this.stripeAccountExists !== null) {
      this.showOtpDialog = true;
      // Auto-trigger OTP resend for refresh scenario
      if (this.isRefreshScenario) {
        setTimeout(() => {
          this.autoResendOtp();
        }, 500); // Small delay to ensure dialog is fully opened
      }
    } else {
      // Fetch account details to determine if we need to create or link
      this.paymentService.getPaymentAccountDetails().subscribe({
        next: (response) => {
          const providerAccount = this.paymentService.getProviderAccount(response.data);
          this.stripeAccountExists = providerAccount?.stripe_account || false;
          this.showOtpDialog = true;
          // Auto-trigger OTP resend for refresh scenario
          if (this.isRefreshScenario) {
            setTimeout(() => {
              this.autoResendOtp();
            }, 500); // Small delay to ensure dialog is fully opened
          }
        },
        error: (error) => {
          this.showOtpDialog = true;
          // Auto-trigger OTP resend for refresh scenario even on error
          if (this.isRefreshScenario) {
            setTimeout(() => {
              this.autoResendOtp();
            }, 500);
          }
        }
      });
    }
  }

  private completeAccountWithOtp(code: string) {
    this.isSubmittingOtp = true;
    
    // Get country ID from existing provider account or use a default
    let countryId = 148; // Default to US
    
    this.paymentService.getPaymentAccountDetails().subscribe({
      next: (response) => {
        const providerAccount = this.paymentService.getProviderAccount(response.data);
        if (providerAccount?.country?.id) {
          countryId = providerAccount.country.id;
        }
        
        const request: StripeAccountRequest = { country_id: countryId, code, accept_terms: true };
        
        // Check stripe_account value to determine which API to call
        if (this.stripeAccountExists === true) {
          // Call linkStripeAccount API when stripe_account is true
          this.paymentService.linkStripeAccount(request).subscribe({
            next: (response) => {
              this.handleStripeResponse(response);
            },
            error: (error) => {
              this.isSubmittingOtp = false;
              this.handleServerErrors(error);
            }
          });
        } else {
          // Call createStripeAccount API when stripe_account is false or null
          this.paymentService.createStripeAccount(request).subscribe({
            next: (response) => {
              this.handleStripeResponse(response);
            },
            error: (error) => {
              this.isSubmittingOtp = false;
              this.handleServerErrors(error);
            }
          });
        }
      },
      error: () => {
        // Use default country if can't get account details
        const request: StripeAccountRequest = { country_id: countryId, code, accept_terms: true };
        
        this.paymentService.createStripeAccount(request).subscribe({
          next: (response) => {
            this.handleStripeResponse(response);
          },
          error: (error) => {
            this.isSubmittingOtp = false;
            this.handleServerErrors(error);
          }
        });
      }
    });
  }
  
  private handleStripeResponse(response: any) {
    this.isSubmittingOtp = false;
    this.showOtpDialog = false;
    
    if (response?.data?.stripe_account_link?.url) {
      this.showSuccess(
        this.lang === 'ar' ? 'تم التحقق بنجاح' : 'Successfully Verified',
        this.lang === 'ar' ? 'سيتم توجيهك إلى Stripe لإكمال إعداد الحساب' : 'Redirecting to Stripe to complete account setup'
      );
      window.location.href = response.data.stripe_account_link.url;
    } else {
      this.showError(
        this.lang === 'ar' ? 'حدث خطأ' : 'Error',
        this.lang === 'ar' ? 'لم يتم العثور على رابط الحساب' : 'Account link not found'
      );
    }
  }

  performReturn() {
    this.isLoading = true;
    this.error = '';
    this.completeStripeOnboarding();
  }

  performRefresh() {
    this.isLoading = true;
    this.error = '';
    this.isRefreshScenario = true;
    
    this.paymentService.getPaymentAccountDetails().subscribe({
      next: (response: PaymentDetailsResponse) => {
        this.isLoading = false;
        
        const providerAccount = this.paymentService.getProviderAccount(response.data);
        this.stripeAccountExists = providerAccount?.stripe_account || false;
        
        // Check if details_submitted_at and charges_enable_at are null
        const detailsSubmitted = providerAccount?.details_submitted_at;
        const chargesEnabled = providerAccount?.charges_enable_at;
        
        if (detailsSubmitted === null && chargesEnabled === null) {
          // Show completion needed for refresh scenario
          this.needsCompletion = true;
        } else if (detailsSubmitted) {
          this.completeStripeOnboarding();
        } else {
          this.needsCompletion = true;
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.error = this.lang === 'ar' 
          ? 'حدث خطأ في التحقق من حالة الحساب' 
          : 'Error checking account status';
        this.handleServerErrors(error);
      }
    });
  }

  private autoResendOtp() {
    this.paymentService.generatePaymentOTP().subscribe({
      next: (response) => {
        this.showSuccess(
          this.lang === 'ar' ? 'تم الإرسال بنجاح' : 'Successfully Sent',
          this.lang === 'ar' ? 'تم إرسال رمز التحقق الجديد إلى بريدك الإلكتروني' : 'New verification code sent to your email'
        );
      },
      error: (error) => {
        // Don't show error for auto-resend, just log it
        console.warn('Auto-resend OTP failed:', error);
      }
    });
  }

  goToSetup() {
    this.router.navigate(['/app/setup-payment-info']);
  }

  // OTP Dialog methods
  closeOtpDialog() {
    this.showOtpDialog = false;
    this.otpCode = '';
  }
  
  submitOtp() {
    if (this.otpCode.trim().length >= 4) {
      this.completeAccountWithOtp(this.otpCode.trim());
    } else {
      this.showError(
        this.lang === 'ar' ? 'خطأ في التحقق' : 'Verification Error',
        this.lang === 'ar' ? 'يرجى إدخال رمز التحقق' : 'Please enter the verification code'
      );
    }
  }
  
  resendOtp() {
    if (!this.canResendOtp) return;

    this.paymentService.generatePaymentOTP().subscribe({
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

  private handleServerErrors(error: any) {
    if (error?.error) {
      // Handle new error format: {"message":"Invalid Code","errors":{"common":["Invalid Code"]}}
      if (error.error.errors) {
        const serverErrors = error.error.errors;
        for (const key in serverErrors) {
          if (serverErrors.hasOwnProperty(key)) {
            const messages = serverErrors[key];
            if (error.error.type === "warning") {
              this.showWarn('Error',messages.join(", "));
            } else if (Array.isArray(messages)) {
              this.showError('Error',messages.join(", "));
            } else {
              this.showError('Error',messages);
            }
          }
        }
      } 
      // Handle simple message format
      else if (error.error.message) {
        if (error.error.type === "warning") {
          this.showWarn('Error',error.error.message);
        } else {
          this.showError('Error',error.error.message);
        }
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