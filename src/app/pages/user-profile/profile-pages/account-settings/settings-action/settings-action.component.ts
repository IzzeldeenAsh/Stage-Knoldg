import { Component, Injector, OnInit } from '@angular/core';
import { IForsightaProfile } from 'src/app/_fake/models/profile.interface';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { UserRequestsService } from 'src/app/_fake/services/user-requests/user-requests.service';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-settings-action',
  templateUrl: './settings-action.component.html',
  styleUrl: './settings-action.component.scss'
})
export class SettingsActionComponent extends BaseComponent implements OnInit {
  roles:any[] = [];
  isDeactivateRequestPending:boolean = false;
  isDeleteAccountRequesInsighterPending:boolean = false;
  isDeleteAccountRequesCompanyPending:boolean = false;
  isActive:boolean = true;
  isPrimaryKey:boolean = false;
  profile:IForsightaProfile;
  constructor(
    injector:Injector,
    private userRequestsService: UserRequestsService,
    private getProfileService: ProfileService
  
  ){
    super(injector);

  }
  ngOnInit(): void {
    const profile = this.getProfileService.getProfile()
    .subscribe(
      {
        next:(profile)=>{
          this.profile = profile;
          this.roles = profile.roles;
          if(this.roles.includes('company')){
            this.isActive = profile.company.status === "active";
          }else if(this.roles.includes('insighter')){
            this.isActive = profile.insighter_status === "active";
          }
        },
        error:(err)=>{
          console.log(err);
        }
      }
    )
    this.unsubscribe.push(profile);
    this.getUserRequests();
  }

  refresh(){
    window.location.reload();
  }

  getUserRequests(){
    const userReqSub = this.userRequestsService.getAllUserRequests(this.lang).subscribe((res: any) => {
    const isThereDeactivateRequest = res.find((request: any) => request.type.key === 'deactivate_company');
    const isThereDeleteAccountRequesInsighter = res.find((request: any) => request.type.key === 'deactivate_delete_insighter');
    const isThereDeleteAccountRequesCompany = res.find((request: any) => 
      request.type.key === 'deactivate_delete_company' && 
      request.requestable?.legal_name === this.profile?.company?.legal_name
    );
    const ActivateRequestCompany = res.find((request: any) => request.type.key === 'activate_company');
    if(isThereDeactivateRequest){
      this.isDeactivateRequestPending = isThereDeactivateRequest?.final_status === "pending";
    }
    if(isThereDeleteAccountRequesInsighter){
      this.isDeleteAccountRequesInsighterPending = isThereDeleteAccountRequesInsighter['final_status'] == "pending" || isThereDeleteAccountRequesInsighter['final_status'] == "declined";
     
    }
    if(isThereDeleteAccountRequesCompany){
      this.isDeleteAccountRequesCompanyPending = isThereDeleteAccountRequesCompany.final_status === "pending" || isThereDeleteAccountRequesCompany.final_status === "declined";
    }
    if(ActivateRequestCompany){
      this.isPrimaryKey = !!ActivateRequestCompany.requestable.primary_activate_at;
    }
    });
    this.unsubscribe.push(userReqSub);
  }

  hasRole(requiredRoles: string[]): boolean {
    return requiredRoles.some((role) => this.roles.includes(role));
  }
}
