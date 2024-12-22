import { Component, Injector, OnInit } from "@angular/core";
import { DeactivateAccountService } from "src/app/_fake/services/deactivate-account/deactivate-account.service";
import { ProfileService } from "src/app/_fake/services/get-profile/get-profile.service";
import { BaseComponent } from "src/app/modules/base.component";

@Component({
  selector: "app-deactivate-modal",
  templateUrl: "./deactivate-modal.component.html",
  styleUrl: "./deactivate-modal.component.scss",
})
export class DeactivateModalComponent extends BaseComponent implements OnInit {
  deactivationReason: string = "";
  step: number = 1;
  roles:any[] = [];
  constructor(
    injector: Injector,
    private _deactivateService: DeactivateAccountService,
    private getProfileService: ProfileService
  ) {
    super(injector);
  }

  ngOnInit(): void {
  const profile = this.getProfileService.getProfile()
  .subscribe(
    {
      next:(profile)=>{
        this.roles = profile.roles;
      },
    }
  ) 
  this.unsubscribe.push(profile);
  }

  hasRole(role:string[]){
    return this.roles.some((r:any)=>role.includes(r));
  }



  deactivateInsighter(){
    const deactivateSub = this._deactivateService.deactivateInsighterWithoutDelete(this.deactivationReason,'0',this.lang).subscribe({
      next:(res)=>{
        const message = this.lang === "ar" ? "تم إلغاء التنشيط بنجاح" : "Account deactivated successfully";
        this.showSuccess("",message);
        this.step = 2;
      },
      error:(err)=>{
        this.handleServerErrors(err);
      }
    })
    this.unsubscribe.push(deactivateSub);
  }
  deactivateCompany(){
    const deactivateSub = this._deactivateService.deactivateCompanyWithoutDelete(this.deactivationReason,'0',this.lang).subscribe({
      next:(res)=>{
       const message = this.lang === "ar" ? "تم إلغاء التنشيط بنجاح" : "Account deactivated successfully";
       this.showSuccess("",message);
       this.step = 2;
      },
      error:(err)=>{
        this.handleServerErrors(err);
      }
    })
    this.unsubscribe.push(deactivateSub);
  }


  deactivateAccount() {
    if(this.hasRole(['insighter'])){
      this.deactivateInsighter();
    }
    else if(this.hasRole(['company'])){
      this.deactivateCompany();
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
