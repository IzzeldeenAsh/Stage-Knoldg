import { ChangeDetectorRef, Component, Injector, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IKnoldgProfile } from 'src/app/_fake/models/profile.interface';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { BaseComponent } from 'src/app/modules/base.component';
import { PaymentService, AccountDetailsResponse, SetPaymentTypeRequest } from 'src/app/_fake/services/payment/payment.service';
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
  paymentAccountDetails: AccountDetailsResponse['data'] | null = null;
  paymentAccountLoading: boolean = false;
  paymentAccountError: string | null = null;
  switchingAccount: boolean = false;

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

    const subscription = this.paymentService.getAccountDetails().subscribe({
      next: (response: AccountDetailsResponse) => {
        this.paymentAccountDetails = response.data;
        this.paymentAccountLoading = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        if (error.status === 404) {
          this.paymentAccountDetails = null;
        } else {
          this.paymentAccountError = this.lang === 'ar' ? 'فشل في تحميل بيانات حساب الدفع' : 'Failed to load payment account details';
        }
        this.paymentAccountLoading = false;
        this.cdr.detectChanges();
      }
    });
    this.unsubscribe.push(subscription);
  }

  isManualAccount(): boolean {
    return this.paymentAccountDetails?.primary?.type === 'manual';
  }

  isStripeAccount(): boolean {
    return this.paymentAccountDetails?.primary?.type === 'provider';
  }

  getPrimaryAccountDetails() {
    return this.paymentAccountDetails?.primary || null;
  }

  getSecondaryAccountDetails() {
    return this.paymentAccountDetails?.secondary || null;
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

  onSecondaryCardClick() {
    if (!this.paymentAccountDetails?.secondary) return;

    const secondaryAccount = this.paymentAccountDetails.secondary;
    
    Swal.fire({
      title: this.lang === 'ar' ? 'تغيير حساب الدفع الأساسي' : 'Change Primary Payment Account',
      text: this.lang === 'ar' ? 'هل تريد تغيير حساب الدفع الأساسي؟' : 'Do you want to change your primary payment account?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: this.lang === 'ar' ? 'نعم' : 'Yes',
      cancelButtonText: this.lang === 'ar' ? 'إلغاء' : 'Cancel',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        this.handleSecondaryAccountSwitch(secondaryAccount);
      }
    });
  }

  private handleSecondaryAccountSwitch(secondaryAccount: any) {
    if (secondaryAccount.status === 'active') {
      this.switchToSecondaryAccount();
      return;
    }

    if (secondaryAccount.type === 'manual') {
      this.handleInactiveManualAccount();
    } else if (secondaryAccount.type === 'provider') {
      this.handleInactiveProviderAccount(secondaryAccount);
    }
  }

  private switchToSecondaryAccount() {
    const request: SetPaymentTypeRequest = {
      type: this.paymentAccountDetails?.secondary?.type as 'manual' | 'provider',
      accept_terms: true
    };

    this.switchingAccount = true;
    this.cdr.detectChanges();

    const subscription = this.paymentService.setPaymentType(request).subscribe({
      next: () => {
        this.switchingAccount = false;
        this.showSuccess(
          this.lang === 'ar' ? 'نجح' : 'Success',
          this.lang === 'ar' ? 'تم تغيير حساب الدفع الأساسي بنجاح' : 'Primary payment account changed successfully'
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

  private handleInactiveManualAccount() {
    Swal.fire({
      title: this.lang === 'ar' ? 'الحساب اليدوي غير مكتمل' : 'Manual Account Incomplete',
      text: this.lang === 'ar' ? 'يحتاج الحساب اليدوي إلى التحديث' : 'The manual account needs to be updated',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: this.lang === 'ar' ? 'تحديث' : 'Update',
      cancelButtonText: this.lang === 'ar' ? 'إلغاء' : 'Cancel',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        this.router.navigate(['/app/setup-payment-info']);
      }
    });
  }

  private handleInactiveProviderAccount(secondaryAccount: any) {
    if (!secondaryAccount.details_submitted_at) {
      Swal.fire({
        title: this.lang === 'ar' ? 'الحساب غير مكتمل' : 'Account Incomplete',
        text: this.lang === 'ar' ? 'حسابك غير مكتمل وتحتاج إلى استكماله' : 'Your account is not complete and needs to be completed',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: this.lang === 'ar' ? 'إكمال' : 'Complete',
        cancelButtonText: this.lang === 'ar' ? 'إغلاق' : 'Close',
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33'
      }).then((result) => {
        if (result.isConfirmed) {
          this.router.navigate(['/app/setup-payment-info']);
        }
      });
    } else if (secondaryAccount.details_submitted_at && !secondaryAccount.charges_enable_at) {
      Swal.fire({
        title: this.lang === 'ar' ? 'الحساب قيد المراجعة' : 'Account Under Review',
        text: this.lang === 'ar' ? 'حسابك قيد المراجعة من قبل المزود وتحتاج إلى انتظار انتهاء المراجعة للتبديل إليه' : 'Your account is under verification by the provider and you need to wait until verification is complete to switch to it',
        icon: 'info',
        confirmButtonText: this.lang === 'ar' ? 'موافق' : 'OK',
        confirmButtonColor: '#3085d6'
      });
    }
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

  isPrimaryAccountInactive(): boolean {
    return this.paymentAccountDetails?.primary?.status === 'inactive';
  }

  getInactiveAccountMessage(): string {
    return this.lang === 'ar' 
      ? 'حسابك الأساسي غير نشط. يرجى التبديل أو تحديث طريقة الدفع الخاصة بك.'
      : 'Your primary account is inactive. Please switch or update your payment method.';
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
