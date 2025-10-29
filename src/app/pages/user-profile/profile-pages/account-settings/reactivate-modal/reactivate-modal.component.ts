import { Component, Injector, OnInit } from '@angular/core';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { UserRequestsService } from 'src/app/_fake/services/user-requests/user-requests.service';
import { BaseComponent } from 'src/app/modules/base.component';
declare var bootstrap: any;

@Component({
  selector: 'app-reactivate-modal',
  templateUrl: './reactivate-modal.component.html'
})
export class ReactivateModalComponent extends BaseComponent implements OnInit {
    constructor(injector:Injector, 
        private userRequestsService:UserRequestsService , private profileService:ProfileService)
        {
        super(injector);
    }
    step:number = 1;
    successStep:boolean = false;
    errorStep:boolean = false;
    isLoading:boolean = false;
    roles:string[] = [];
  ngOnInit(): void {
    const profileSub = this.profileService.getProfile().subscribe({
      next:(res)=>{
        this.roles = res.roles;
      }
    })
    this.unsubscribe.push(profileSub);  
  }
  reactivateAccount() {
const reactivateRequest = this.userRequestsService.sendReactivateRequest(this.roles.includes('company') ? 'company' : 'insighter');
reactivateRequest.subscribe({
    next:()=>{
         this.showSuccess('',this.lang === "ar" ? "تم إعادة تفعيل حسابك بنجاح" : "Your account has been successfully reactivated");
         const modal = bootstrap.Modal.getInstance(document.getElementById('reactivateModal'));
         modal.hide();
    },
    error:()=>{
        this.errorStep = true;
        const message = this.lang === "ar" ? "حدث خطأ أثناء إعادة تفعيل حسابك" : "An error occurred while reactivating your account";
        this.showError('',message);
        const modal = bootstrap.Modal.getInstance(document.getElementById('reactivateModal'));
        modal.hide();
    }
})

  }

  refresh() {
    window.location.reload();
  }


} 