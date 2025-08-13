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
          this.lang === 'ar' ? 'تم الإكمال' : 'Success',
          this.lang === 'ar' ? 'تم إعداد حساب Stripe بنجاح' : 'Stripe account setup completed successfully'
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
    this.paymentService.getStripeLink().subscribe({
      next: (response) => {
        if (response?.data?.stripe_account_link?.url) {
          window.location.href = response.data.stripe_account_link.url;
        } else {
          this.showError(
            this.lang === 'ar' ? 'حدث خطأ' : 'Error',
            this.lang === 'ar' ? 'لم يتم العثور على رابط الحساب' : 'Account link not found'
          );
        }
      },
      error: (error) => {
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