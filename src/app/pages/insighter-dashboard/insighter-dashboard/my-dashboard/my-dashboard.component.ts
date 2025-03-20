import { Component, Injector } from '@angular/core';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { BaseComponent } from 'src/app/modules/base.component';
import { UserRequestsService } from 'src/app/_fake/services/user-requests/user-requests.service';

@Component({
  selector: 'app-my-dashboard',
  templateUrl: './my-dashboard.component.html',
  styleUrl: './my-dashboard.component.scss'
})
export class MyDashboardComponent extends BaseComponent {
  roles: any[] = [];
  hasPendingActivationRequest: boolean = false;

constructor(
  injector: Injector,
  private profileService: ProfileService,
  private userRequestsService: UserRequestsService
){
  super(injector);
}

ngOnInit(){
  const profileSub = this.profileService.getProfile().subscribe((res: any) => {
    this.roles = res.roles;
  });
  this.unsubscribe.push(profileSub);

  // Check if user has a pending activation request
  const requestsSub = this.userRequestsService.getAllUserRequests(this.lang).subscribe((requests) => {
    this.hasPendingActivationRequest = requests.some(
      request => request.type.key === 'activate_company' && request.status === 'pending'
    );
  });
  this.unsubscribe.push(requestsSub);
}

hasRole(role: string){
  return this.roles.includes(role);
}

}

