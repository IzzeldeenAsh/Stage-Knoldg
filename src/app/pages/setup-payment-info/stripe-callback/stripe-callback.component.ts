import { Component, Injector, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { BaseComponent } from 'src/app/modules/base.component';
import { PaymentService, StripeAccountDetailsResponse } from 'src/app/_fake/services/payment/payment.service';

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
    public paymentService: PaymentService
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
    this.paymentService.getStripeAccountDetails().subscribe({
      next: (response: StripeAccountDetailsResponse) => {
        this.isLoading = false;
        if (response?.data?.details_submitted_at) {
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
    this.paymentService.completeStripeOnboarding().subscribe({
      next: (response) => {
        this.isLoading = false;
        this.isCompleted = true;
        this.showSuccess(
          this.lang === 'ar' ? 'تم الإكمال بنجاح' : 'Successfully Completed',
          this.lang === 'ar' ? 'تم إعداد حساب Stripe بنجاح وهو جاهز للاستخدام' : 'Stripe account setup completed successfully and ready to use'
        );
        setTimeout(() => {
          this.router.navigate(['/app/setup-payment-info/success'], { 
            queryParams: { type: 'stripe' } 
          });
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
    // Show OTP dialog
    this.showOtpDialog = true;
  }

  private completeAccountWithOtp(code: string) {
    this.isSubmittingOtp = true;
    this.paymentService.getStripeLink(code).subscribe({
      next: (response) => {
        this.isSubmittingOtp = false;
        this.showOtpDialog = false;
        if (response?.data?.stripe_account_link?.url) {
          this.showSuccess(
            this.lang === 'ar' ? 'تم التحقق بنجاح' : 'Successfully Verified',
            this.lang === 'ar' ? 'سيتم توجيهك إلى Stripe لإكمال إعداد الحساب' : 'Redirecting to Stripe to complete account setup'
          );
          // Small delay to show success message before redirect
          setTimeout(() => {
            window.location.href = response.data.stripe_account_link.url;
          }, 1500);
        } else {
          this.showError(
            this.lang === 'ar' ? 'حدث خطأ' : 'Error',
            this.lang === 'ar' ? 'لم يتم العثور على رابط الحساب' : 'Account link not found'
          );
        }
      },
      error: (error) => {
        this.isSubmittingOtp = false;
        this.handleServerErrors(error);
      }
    });
  }

  performReturn() {
    this.isLoading = true;
    this.error = '';
    this.completeStripeOnboarding();
  }

  performRefresh() {
    this.isLoading = true;
    this.error = '';
    this.performStripeStatusCheck();
  }

  goToSetup() {
    this.router.navigate(['/setup-payment-info']);
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