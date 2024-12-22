import { Component, Injector } from "@angular/core";
import { DeactivateAccountService } from "src/app/_fake/services/deactivate-account/deactivate-account.service";
import { BaseComponent } from "src/app/modules/base.component";

@Component({
  selector: "app-deactivate-modal",
  templateUrl: "./deactivate-modal.component.html",
  styleUrl: "./deactivate-modal.component.scss",
})
export class DeactivateModalComponent extends BaseComponent {
  deactivationReason: string = "";
  step: number = 1;
  constructor(
    injector: Injector,
    private _deactivateService: DeactivateAccountService
  ) {
    super(injector);
  }

  deactivateAccount() {
    // TODO: Implement account deactivation logic
    // const deactivateSub = this._deactivateService
    //   .deactivateRequest(this.deactivationReason , this.lang ? this.lang : "en")
    //   .subscribe({
    //     next: (res) => {
    //       const message =
    //         this.lang === "ar"
    //           ? "تم إرسال طلب إلغاء التنشيط بنجاح"
    //           : "Account deactivation request sent successfully";
    //       this.showSuccess("", message);
    //       this.step = 2;
    //     },
    //     error: (err) => {
    //       this.handleServerErrors(err);
    //     },
    //   });

    // this.unsubscribe.push(deactivateSub);
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
