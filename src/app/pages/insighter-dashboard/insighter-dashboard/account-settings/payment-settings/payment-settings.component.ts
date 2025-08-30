import { ChangeDetectorRef, Component, Injector, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IKnoldgProfile } from 'src/app/_fake/models/profile.interface';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { BaseComponent } from 'src/app/modules/base.component';
import { PaymentService, PaymentDetailsResponse, PaymentMethod } from 'src/app/_fake/services/payment/payment.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-payment-settings',
  templateUrl: './payment-settings.component.html',
  styleUrls: ['./payment-settings.component.scss']
})
export class PaymentSettingsComponent extends BaseComponent implements OnInit {
  profile: IKnoldgProfile;
  roles: string[];
  isActive: boolean = true;
  paymentMethods: PaymentMethod[] = [];
  paymentAccountLoading: boolean = false;
  paymentAccountError: string | null = null;
  switchingAccount: boolean = false;
  deletingAccount: { [key: string]: boolean } = {};

  constructor(
    injector: Injector,
    private getProfileService: ProfileService,
    private cdr: ChangeDetectorRef,
    private paymentService: PaymentService,
    private router: Router
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.getProfile();
    this.loadPaymentAccountDetails();
  }

  getProfile() {
    const subscription = this.getProfileService.getProfile()
      .subscribe(
        (profile: IKnoldgProfile) => {
          this.profile = profile;
          this.roles = profile.roles;
          switch (true) {
            case this.hasRole(['insighter']):
              this.isActive = profile.insighter_status === "active";
              break;
            case this.hasRole(['company']):
              this.isActive = profile.company?.status === "active";
              break;
            default:
              this.isActive = false;
          }
          this.cdr.detectChanges();
        }
      )
    this.unsubscribe.push(subscription);
  }

  loadPaymentAccountDetails() {
    if (!this.isActive || (!this.hasRole(['insighter']) && !this.hasRole(['company']))) {
      return;
    }

    this.paymentAccountLoading = true;
    this.paymentAccountError = null;

    const subscription = this.paymentService.getPaymentAccountDetails().subscribe({
      next: (response: PaymentDetailsResponse) => {
        this.paymentMethods = response.data || [];
        this.paymentAccountLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        if (error.status === 404) {
          this.paymentMethods = [];
        } else {
          this.paymentAccountError = this.lang === 'ar' ? 'فشل في تحميل بيانات حساب الدفع' : 'Failed to load payment account details';
        }
        this.paymentAccountLoading = false;
        this.cdr.detectChanges();
      }
    });
    this.unsubscribe.push(subscription);
  }

  getVisiblePaymentMethods(): PaymentMethod[] {
    return this.paymentMethods.filter(method => {
      if (method.type === 'manual') {
        return method.status === 'active';
      }
      if (method.type === 'provider') {
        return method.status === 'active' || method.details_submitted_at !== null;
      }
      return false;
    });
  }

  getPrimaryMethod(): PaymentMethod | null {
    return this.paymentMethods.find(m => m.primary) || null;
  }

  getActiveNonPrimaryMethods(): PaymentMethod[] {
    return this.paymentMethods.filter(m => !m.primary && m.status === 'active');
  }

  getCountryFlagPath(countryName: string): string {
    if (!countryName) return 'assets/media/flags/default.svg';
    
    // Convert country name to lowercase and replace spaces with hyphens
    const flagFileName = countryName.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      + '.svg';
    
    return `assets/media/flags/${flagFileName}`;
  }

  refreshPaymentAccountDetails() {
    this.loadPaymentAccountDetails();
  }

  navigateToSetupPayment() {
    this.router.navigate(['/app/setup-payment-info']);
  }

  hasRole(requiredRoles: string[]): boolean {
    return requiredRoles.some((role) => this.roles.includes(role));
  }

  onSetAsPrimary(method: PaymentMethod) {
    Swal.fire({
      title: this.lang === 'ar' ? 'تعيين كطريقة دفع أساسية' : 'Set as Primary Payment Method',
      text: this.lang === 'ar' ? 'هل تريد تعيين هذه كطريقة الدفع الأساسية؟' : 'Do you want to set this as your primary payment method?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: this.lang === 'ar' ? 'نعم' : 'Yes',
      cancelButtonText: this.lang === 'ar' ? 'إلغاء' : 'Cancel',
      confirmButtonColor: '#17c1e8',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        this.setPrimaryMethod(method.type);
      }
    });
  }

  onEditManual() {
    this.router.navigate(['/app/setup-payment-info/manual-account'], { queryParams: { edit: 'true' } });
  }

  onDeleteMethod(method: PaymentMethod) {
    const methodTypeText = this.getAccountTypeText(method.type);
    Swal.fire({
      title: this.lang === 'ar' ? 'حذف طريقة الدفع' : 'Delete Payment Method',
      text: this.lang === 'ar' ? `هل أنت متأكد من حذف ${methodTypeText}؟` : `Are you sure you want to delete ${methodTypeText}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.lang === 'ar' ? 'نعم، احذف' : 'Yes, delete',
      cancelButtonText: this.lang === 'ar' ? 'إلغاء' : 'Cancel',
      confirmButtonColor: '#dc3545',
      cancelButtonColor: '#6c757d'
    }).then((result) => {
      if (result.isConfirmed) {
        this.deletePaymentMethod(method);
      }
    });
  }

  private deletePaymentMethod(method: PaymentMethod) {
    const key = `${method.type}_${method.primary}`;
    this.deletingAccount[key] = true;
    this.cdr.detectChanges();

    const deleteObservable = method.type === 'manual' 
      ? this.paymentService.deleteManualAccount()
      : this.paymentService.deleteStripeAccount();

    const subscription = deleteObservable.subscribe({
      next: () => {
        this.deletingAccount[key] = false;
        this.showSuccess(
          this.lang === 'ar' ? 'نجح' : 'Success',
          this.lang === 'ar' ? 'تم حذف طريقة الدفع بنجاح' : 'Payment method deleted successfully'
        );
        this.loadPaymentAccountDetails();
      },
      error: (error: any) => {
        this.deletingAccount[key] = false;
        this.cdr.detectChanges();
        this.handleServerErrors(error);
      }
    });
    this.unsubscribe.push(subscription);
  }

  private setPrimaryMethod(type: 'manual' | 'provider') {
    this.switchingAccount = true;
    this.cdr.detectChanges();

    const subscription = this.paymentService.setPrimaryPaymentMethod(type).subscribe({
      next: () => {
        this.switchingAccount = false;
        this.showSuccess(
          this.lang === 'ar' ? 'نجح' : 'Success',
          this.lang === 'ar' ? 'تم تعيين طريقة الدفع الأساسية بنجاح' : 'Primary payment method set successfully'
        );
        this.loadPaymentAccountDetails();
      },
      error: (error: any) => {
        this.switchingAccount = false;
        this.cdr.detectChanges();
        this.handleServerErrors(error);
      }
    });
    this.unsubscribe.push(subscription);
  }

  canShowProviderCard(method: PaymentMethod): boolean {
    if (method.type !== 'provider') return false;
    return method.status === 'active' || method.details_submitted_at !== null;
  }

  getStatusBadgeClass(account: any): string {
    if (account.type === 'provider') {
      if (!account.details_submitted_at) {
        return 'badge-light-danger';
      } else if (account.details_submitted_at && !account.charges_enable_at) {
        return 'badge-light-warning';
      } else if (account.charges_enable_at) {
        return 'badge-light-success';
      }
    }
    
    if (account.status === 'active') {
      return 'badge-light-success';
    }
    return 'badge-light-warning';
  }

  getStatusText(account: any): string {
    if (account.type === 'provider') {
      if (!account.details_submitted_at) {
        return this.lang === 'ar' ? 'غير مكتمل' : 'Incomplete';
      } else if (account.details_submitted_at && !account.charges_enable_at) {
        return this.lang === 'ar' ? 'قيد المراجعة' : 'Under Review';
      } else if (account.charges_enable_at) {
        return this.lang === 'ar' ? 'نشط' : 'Active';
      }
    }
    return account.status === 'active' ? 
      (this.lang === 'ar' ? 'نشط' : 'Active') : 
      (this.lang === 'ar' ? 'غير نشط' : 'Inactive');
  }

  getAccountTypeText(type: string): string {
    return type === 'provider' ? 
      (this.lang === 'ar' ? 'مزود الخدمة' : 'Provider') : 
      (this.lang === 'ar' ? 'حساب بنكي' : 'Bank Account');
  }

  getAccountTypeIcon(type: string): string {
    return type === 'provider' ? 'bi bi-credit-card' : 'bi bi-bank';
  }

  maskIban(iban: string | undefined): string {
    if (!iban) return 'XXXX XXXX XXXX XXXX XXXX';
    // Show first 4 and last 4 characters, mask the middle
    if (iban.length <= 8) return iban; // Don't mask if too short
    const start = iban.substring(0, 4);
    const end = iban.substring(iban.length - 4);
    const middle = 'XXXX XXXX XXXX';
    return `${start} ${middle} ${end}`;
  }

  getProviderStatusExplanation(account: any): string {
    if (account.type !== 'provider') return '';
    
    if (!account.details_submitted_at) {
      return this.lang === 'ar' ? 
        'يجب إكمال إعداد الحساب لدى مزود الدفع' : 
        'Account setup with payment provider needs to be completed';
    } else if (account.details_submitted_at && !account.charges_enable_at) {
      return this.lang === 'ar' ? 
        'تم إرسال النموذج وجاري المراجعة من قبل مزود الدفع' : 
        'Form submitted and under review by payment provider';
    } else if (account.charges_enable_at) {
      return this.lang === 'ar' ? 
        'الحساب مكتمل ومُفعل للاستخدام' : 
        'Account is complete and activated for use';
    }
    return '';
  }

  shouldShowFormSubmittedBadge(account: any): boolean {
    return account.type === 'provider' && account.details_submitted_at;
  }

  getProviderStatusIcon(account: any): string {
    if (account.type !== 'provider') return '';
    
    if (!account.details_submitted_at) {
      return 'bi bi-exclamation-circle';
    } else if (account.details_submitted_at && !account.charges_enable_at) {
      return 'bi bi-clock';
    } else if (account.charges_enable_at) {
      return 'bi bi-check-circle';
    }
    return 'bi bi-exclamation-circle';
  }

  hasNoPaymentMethods(): boolean {
    return this.getVisiblePaymentMethods().length === 0;
  }

  onAddPaymentMethod() {
    this.router.navigate(['/app/setup-payment-info']);
  }

  formatIban(iban: string | undefined): string {
    if (!iban) return 'Not Available';
    // Format IBAN with spaces for better readability (groups of 4)
    return iban.replace(/(.{4})/g, '$1 ').trim();
  }

  copyToClipboard(text: string) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        this.showSuccess(
          this.lang === 'ar' ? 'تم النسخ' : 'Copied',
          this.lang === 'ar' ? 'تم نسخ IBAN بنجاح' : 'IBAN copied to clipboard'
        );
      }).catch(() => {
        this.fallbackCopyToClipboard(text);
      });
    } else {
      this.fallbackCopyToClipboard(text);
    }
  }

  private fallbackCopyToClipboard(text: string) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      this.showSuccess(
        this.lang === 'ar' ? 'تم النسخ' : 'Copied',
        this.lang === 'ar' ? 'تم نسخ IBAN بنجاح' : 'IBAN copied to clipboard'
      );
    } catch (err) {
      this.showError(
        this.lang === 'ar' ? 'خطأ' : 'Error',
        this.lang === 'ar' ? 'فشل في نسخ النص' : 'Failed to copy text'
      );
    } finally {
      document.body.removeChild(textArea);
    }
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
}
