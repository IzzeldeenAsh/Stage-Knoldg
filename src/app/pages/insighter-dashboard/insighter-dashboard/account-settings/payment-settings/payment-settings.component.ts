import { ChangeDetectorRef, Component, Injector, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IKnoldgProfile } from 'src/app/_fake/models/profile.interface';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { BaseComponent } from 'src/app/modules/base.component';
import { PaymentService, StripeAccountDetailsResponse, ManualAccountDetailsResponse } from 'src/app/_fake/services/payment/payment.service';

@Component({
  selector: 'app-payment-settings',
  templateUrl: './payment-settings.component.html',
  styleUrls: ['./payment-settings.component.scss']
})
export class PaymentSettingsComponent extends BaseComponent implements OnInit {
  profile: IKnoldgProfile;
  roles: string[];
  isActive: boolean = true;
  paymentAccountDetails: StripeAccountDetailsResponse['data'] | ManualAccountDetailsResponse['data'] | null = null;
  paymentAccountLoading: boolean = false;
  paymentAccountError: string | null = null;

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

    const subscription = this.paymentService.getStripeAccountDetails().subscribe({
      next: (response: StripeAccountDetailsResponse) => {
        this.paymentAccountDetails = response.data;
        this.paymentAccountLoading = false;
        this.cdr.detectChanges();
      },
      error: (stripeError) => {
        // If stripe fails, try manual account
        const manualSubscription = this.paymentService.getManualAccountDetails().subscribe({
          next: (response: ManualAccountDetailsResponse) => {
            this.paymentAccountDetails = response.data;
            this.paymentAccountLoading = false;
            this.cdr.detectChanges();
          },
          error: (manualError) => {
            if (stripeError.status === 404 && manualError.status === 404) {
              this.paymentAccountDetails = null;
            } else {
              this.paymentAccountError = this.lang === 'ar' ? 'فشل في تحميل بيانات حساب الدفع' : 'Failed to load payment account details';
            }
            this.paymentAccountLoading = false;
            this.cdr.detectChanges();
          }
        });
        this.unsubscribe.push(manualSubscription);
      }
    });
    this.unsubscribe.push(subscription);
  }

  isManualAccount(): boolean {
    return this.paymentAccountDetails?.type === 'manual';
  }

  isStripeAccount(): boolean {
    return this.paymentAccountDetails?.type === 'stripe';
  }

  getManualAccountDetails(): ManualAccountDetailsResponse['data'] | null {
    return this.isManualAccount() ? this.paymentAccountDetails as ManualAccountDetailsResponse['data'] : null;
  }

  getStripeAccountDetails(): StripeAccountDetailsResponse['data'] | null {
    return this.isStripeAccount() ? this.paymentAccountDetails as StripeAccountDetailsResponse['data'] : null;
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
}
