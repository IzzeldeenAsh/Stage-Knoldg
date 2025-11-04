import { Component, OnInit, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BaseComponent } from 'src/app/modules/base.component';
import { FundService, InsighterWalletDetails } from 'src/app/_fake/services/fund.service';

@Component({
  selector: 'app-insighter-wallet-form',
  templateUrl: './insighter-wallet-form.component.html',
  styleUrls: ['./insighter-wallet-form.component.scss']
})
export class InsighterWalletFormComponent extends BaseComponent implements OnInit {
  insighterId: number = 0;
  insighterData: InsighterWalletDetails | null = null;
  isLoading: boolean = false;
  emailForm: FormGroup;
  isSendingEmail: boolean = false;

  constructor(
    injector: Injector,
    private route: ActivatedRoute,
    private router: Router,
    private fundService: FundService,
    private fb: FormBuilder
  ) {
    super(injector);
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.insighterId = +params['id'];
      if (this.insighterId) {
        this.loadInsighterWalletDetails();
      }
    });
  }

  private loadInsighterWalletDetails(): void {
    this.isLoading = true;
    this.fundService.getInsighterWalletDetails(this.insighterId)
      .subscribe({
        next: (data) => {
          this.insighterData = data;
          this.emailForm.patchValue({
            email: data.user_email || ''
          });
          this.isLoading = false;
        },
        error: (error) => {
          this.handleServerErrors(error);
          this.isLoading = false;
        }
      });
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
        this.lang === "ar" ? "حدث خطأ" : "An unexpected error occurred."
      );
    }
  }

  goBack(): void {
    this.router.navigate(['/admin-dashboard/admin/fund/insighter-wallets']);
  }

  onPrint(): void {
    window.print();
  }

  onShareWhatsapp(): void {
    if (!this.insighterData) {
      this.showError(
        this.lang === 'ar' ? 'خطأ' : 'Error',
        this.lang === 'ar' ? 'لا توجد بيانات للمشاركة' : 'No data available to share'
      );
      return;
    }

    const message = this.generateWhatsAppMessage();
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
  }

  private generateWhatsAppMessage(): string {
    if (!this.insighterData) return '';

    const isArabic = this.lang === 'ar';

    if (isArabic) {
      return `📋 *نموذج تحويل الأموال - Insighta*

👤 *معلومات المستفيد:*
الاسم: ${this.insighterData.user_name}
البريد الإلكتروني: ${this.insighterData.user_email}
المستحقات: $${this.insighterData.user_balance?.toFixed(2) || '0.00'}

📝 *تفاصيل الحساب:*
اسم الحساب: ${this.insighterData.account_name || 'غير محدد'}
بلد الإقامة: ${this.insighterData.account_country?.name || 'غير محدد'}
${this.insighterData.account_address ? `عنوان الفوترة: ${this.insighterData.account_address}` : ''}
${this.insighterData.account_phone_code && this.insighterData.account_phone ? `رقم الهاتف: +${this.insighterData.account_phone_code} ${this.insighterData.account_phone}` : ''}

🏦 *معلومات البنك:*
اسم البنك: ${this.insighterData.bank_name || 'غير محدد'}
بلد البنك: ${this.insighterData.bank_country?.name || 'غير محدد'}
${this.insighterData.bank_address ? `عنوان البنك: ${this.insighterData.bank_address}` : ''}
رقم الآيبان: ${this.insighterData.bank_iban || 'غير محدد'}
رمز السويفت: ${this.insighterData.bank_swift_code || 'غير محدد'}

---
تم إنشاؤه من منصة Insighta الإدارية`;
    } else {
      return `📋 *Transfer Form -Insighta*

👤 *Beneficiary Information:*
Name: ${this.insighterData.user_name}
Email: ${this.insighterData.user_email}
Dues: $${this.insighterData.user_balance?.toFixed(2) || '0.00'}

📝 *Account Details:*
Account Name: ${this.insighterData.account_name || 'Not provided'}
Country of Residence: ${this.insighterData.account_country?.name || 'Not provided'}
${this.insighterData.account_address ? `Billing Address: ${this.insighterData.account_address}` : ''}
${this.insighterData.account_phone_code && this.insighterData.account_phone ? `Phone Number: +${this.insighterData.account_phone_code} ${this.insighterData.account_phone}` : ''}

🏦 *Bank Information:*
Bank Name: ${this.insighterData.bank_name || 'Not provided'}
Bank Country: ${this.insighterData.bank_country?.name || 'Not provided'}
${this.insighterData.bank_address ? `Bank Address: ${this.insighterData.bank_address}` : ''}
IBAN Number: ${this.insighterData.bank_iban || 'Not provided'}
SWIFT Code: ${this.insighterData.bank_swift_code || 'Not provided'}

---
Generated from Insighta Admin Platform`;
    }
  }

  onSendEmail(): void {
    const modalElement = document.getElementById('emailModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  sendEmail(): void {
    if (this.emailForm.valid && !this.isSendingEmail) {
      this.isSendingEmail = true;
      const email = this.emailForm.get('email')?.value;

      this.fundService.sendTransferFormToEmail(this.insighterId, email)
        .subscribe({
          next: (response) => {
            this.showSuccess(
              this.lang === 'ar' ? 'تم الإرسال' : 'Email Sent',
              this.lang === 'ar' ? 'تم إرسال النموذج بنجاح' : 'Transfer form sent successfully'
            );
            this.isSendingEmail = false;
            this.emailForm.reset();

            // Close modal
            const modalElement = document.getElementById('emailModal');
            if (modalElement) {
              const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
              modal?.hide();
            }
          },
          error: (error) => {
            this.handleServerErrors(error);
            this.isSendingEmail = false;
          }
        });
    }
  }

  getCurrentDate(): string {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
