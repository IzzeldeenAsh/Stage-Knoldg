import { Component, Injector, OnInit } from '@angular/core';
import { UserRequestsService } from 'src/app/_fake/services/user-requests/user-requests.service';
import { AuthService } from 'src/app/modules/auth';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-settings-action',
  templateUrl: './settings-action.component.html',
  styleUrl: './settings-action.component.scss'
})
export class SettingsActionComponent extends BaseComponent implements OnInit {
  roles:any[] = [];
  isDeactivateRequestPending:boolean = false;
  constructor(
    injector:Injector,
    private _profile:AuthService,
    private userRequestsService: UserRequestsService
  
  ){
    super(injector);
  }
  ngOnInit(): void {
    const profile = this._profile.getProfile()
    .subscribe(
      {
        next:(profile)=>{
          this.roles = profile.roles;
        },
        error:(err)=>{
          console.log(err);
        }
      }
    )

    this.getUserRequests();
  }

  getUserRequests(){
    const userReqSub = this.userRequestsService.getAllUserRequests(this.lang).subscribe((res: any) => {
    const isThereDeactivateRequest = res.find((request: any) => request.type.key === 'deactivate_company');
      console.log(isThereDeactivateRequest);
    if(isThereDeactivateRequest){
      this.isDeactivateRequestPending = isThereDeactivateRequest.status === 'pending';
    }
    });
    this.unsubscribe.push(userReqSub);
  }

  hasRole(requiredRoles: string[]): boolean {
    return requiredRoles.some((role) => this.roles.includes(role));
  }
}
