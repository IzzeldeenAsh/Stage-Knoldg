import { Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponent } from 'src/app/modules/base.component';


@Component({
  selector: 'app-payment-success',
  templateUrl: './payment-success.component.html',
  styleUrls: ['./payment-success.component.scss']
})
export class PaymentSuccessComponent extends BaseComponent implements OnInit {
  paymentType: string = '';
  countdown: number = 5;
  countdownInterval: any;

  constructor(
    injector: Injector,
    private route: ActivatedRoute,
    private router: Router
  ) {
    super(injector);
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.paymentType = params['type'] || 'manual';
    });
    
    // this.startCountdown();
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    super.ngOnDestroy();
  }

  // private startCountdown() {
  //   this.countdownInterval = setInterval(() => {
  //     this.countdown--;
  //     if (this.countdown <= 0) {
  //       this.navigateToAddKnowledge();
  //     }
  //   }, 1000);
  // }

  navigateToAddKnowledge() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    this.router.navigate(['/app/add-knowledge/stepper']);
  }

  getSuccessMessage(): { title: string; subtitle: string; description: string } {
    if (this.paymentType === 'stripe') {
      return {
        title: this.lang === 'ar' ? 'تم إعداد حساب Stripe بنجاح!' : 'Stripe Account Setup Complete!',
        subtitle: this.lang === 'ar' ? 'مبروك! تم ربط حسابك بنجاح' : 'Congratulations! Your account has been successfully linked',
        description: this.lang === 'ar' 
          ? 'تم إعداد حساب Stripe الخاص بك بنجاح. يمكنك الآن استقبال المدفوعات من العملاء بطريقة آمنة ومضمونة.'
          : 'Your Stripe account has been successfully set up. You can now receive payments from clients securely and reliably.'
      };
    } else {
      return {
        title: this.lang === 'ar' ? 'تم إعداد الحساب اليدوي بنجاح!' : 'Manual Account Setup Complete!',
        subtitle: this.lang === 'ar' ? 'مبروك! تم حفظ معلومات حسابك' : 'Congratulations! Your account information has been saved',
        description: this.lang === 'ar' 
          ? 'تم حفظ معلومات الحساب اليدوي الخاص بك بنجاح. سيتم استخدام هذه المعلومات لتحويل المدفوعات إليك.'
          : 'Your manual account information has been successfully saved. This information will be used to transfer payments to you.'
      };
    }
  }

  getPaymentTypeIcon(): string {
    return this.paymentType === 'stripe' ? 'fab fa-stripe-s' : 'fas fa-university';
  }

  getPaymentTypeColor(): string {
    return this.paymentType === 'stripe' ? 'text-primary' : 'text-info';
  }

  getCountdownText(): string {
    if (this.lang === 'ar') {
      return `سيتم التوجيه تلقائياً خلال ${this.countdown} ثوان`;
    } else {
      return `Auto redirecting in ${this.countdown} seconds`;
    }
  }
}