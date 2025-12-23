import { Component, Injector } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { BaseComponent } from 'src/app/modules/base.component';
import { DeactivateAccountService } from 'src/app/_fake/services/deactivate-account/deactivate-account.service';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';

@Component({
  selector: 'app-deactivate-dialog',
  templateUrl: './deactivate-dialog.component.html',
})
export class DeactivateDialogComponent extends BaseComponent {
  deactivationReason: string = "";
  step: number = 1;
  roles: string[] = [];
  isLoading: boolean = false;
  deactivationType: 'user' | 'company' | 'both' = 'both';

  constructor(
    injector: Injector,
    private deactivateService: DeactivateAccountService,
    private getProfileService: ProfileService,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {
    super(injector);
  }

  ngOnInit(): void {
    // Check if deactivationType was passed in dialog data
    if (this.config.data && this.config.data.deactivationType) {
      this.deactivationType = this.config.data.deactivationType;
    }

    const profile = this.getProfileService.getProfile()
      .subscribe({
        next: (profile) => {
          this.roles = profile.roles;
          // Set default deactivation type based on role if not already set
          if (this.hasRole(['company']) && !this.config.data?.deactivationType) {
            this.deactivationType = 'both';
          }
        },
      });
    this.unsubscribe.push(profile);
  }

  deactivateInsighter() {
    this.isLoading = true;
    const deactivateSub = this.deactivateService.deactivateInsighterWithoutDelete(this.deactivationReason, '0', this.lang).subscribe({
      next: () => {
        const message = this.lang === "ar" ? "تم إلغاء التنشيط بنجاح" : "Account deactivated successfully";
        this.showSuccess("", message);
        this.step = 2;
        this.isLoading = false;
        setTimeout(() => {
          this.ref.close(true);
        }, 1500);
      },
      error: (err) => {
        this.handleServerErrors(err);
        this.isLoading = false;
      }
    });
    this.unsubscribe.push(deactivateSub);
  }

  deactivateCompany() {
    this.isLoading = true;
    const deactivateSub = this.deactivateService.deactivateCompanyWithoutDelete(this.deactivationReason, '0', this.lang).subscribe({
      next: () => {
        const message = this.lang === "ar" ? "تم إلغاء التنشيط بنجاح" : "Account deactivated successfully";
        this.showSuccess("", message);
        this.step = 2;
        this.isLoading = false;
        setTimeout(() => {
          this.ref.close(true);
        }, 1500);
      },
      error: (err) => {
        this.handleServerErrors(err);
        this.isLoading = false;
      }
    });
    this.unsubscribe.push(deactivateSub);
  }

  deactivateAccount() {
    if (this.hasRole(['insighter'])) {
      this.deactivateInsighter();
    } else if (this.hasRole(['company'])) {
      // Handle based on selected deactivation type
      if (this.deactivationType === 'user') {
        this.deactivateInsighter();
      } else if (this.deactivationType === 'company') {
        this.deactivateCompany();
      } else if (this.deactivationType === 'both') {
        // First deactivate company, then deactivate the user account
        const deactivateCompanySub = this.deactivateService.deactivateCompanyWithoutDelete(this.deactivationReason, '0', this.lang).subscribe({
          next: () => {
            // After company is deactivated, deactivate the user account
            this.deactivateInsighter();
          },
          error: (err) => {
            this.handleServerErrors(err);
            this.isLoading = false;
          }
        });
        this.unsubscribe.push(deactivateCompanySub);
      }
    }
  }

  hasRole(role: string[]): boolean {
    return this.roles.some((r: any) => role.includes(r));
  }

  private handleServerErrors(error: any) {
    if (error.error && error.error.errors) {
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
    } else {
      this.showError(
        this.lang === "ar" ? "حدث خطأ" : "An error occurred",
        this.lang === "ar" ? "حدث خطأ" : "An unexpected error occurred."
      );
    }
  }
} 