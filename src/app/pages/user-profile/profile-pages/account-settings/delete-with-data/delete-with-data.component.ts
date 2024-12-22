import { Component, Injector, Input } from "@angular/core";
import { DeactivateAccountService } from "src/app/_fake/services/deactivate-account/deactivate-account.service";
import { BaseComponent } from "src/app/modules/base.component";


@Component({
  selector: 'app-delete-with-data',
  templateUrl: './delete-with-data.component.html',
  styleUrl: './delete-with-data.component.scss'
})
export class DeleteWithDataComponent extends BaseComponent {
  deactivationReason: string = "";
  step: number = 1;
  @Input() roles:any[] = [];
  constructor(
    injector: Injector,
    private _deactivateService: DeactivateAccountService
  ) {
    super(injector);
  }

  deactivateAccount() {
    // TODO: Implement account deactivation logic
    if(this.roles.includes('company')){
      const deactivateSub = this._deactivateService
      .deactivateCompanyWithDelete(this.deactivationReason , '0',this.lang ? this.lang : "en")
      .subscribe({
        next: (res) => {
          const message =
            this.lang === "ar"
              ? "تم ارسال طلب إلغاء التنشيط بنجاح"
              : "Account deletion request sent successfully";
          this.showSuccess("", message);
          this.step = 2;
        },
        error: (err) => {
          this.handleServerErrors(err);
        },
      });

    this.unsubscribe.push(deactivateSub);
    }else if(this.roles.includes('insighter')){
      const deactivateSub = this._deactivateService
      .deactivateInsighterWithDelete(this.deactivationReason , '0',this.lang ? this.lang : "en")
      .subscribe({
        next: (res) => {
          const message =
          this.lang === "ar"
            ? "تم ارسال طلب إلغاء التنشيط بنجاح"
            : "Account deletion request sent successfully";
        this.showSuccess("", message);
        this.step = 2;
        },
        error: (err) => {
          this.handleServerErrors(err);
        },
      });
      this.unsubscribe.push(deactivateSub);
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
