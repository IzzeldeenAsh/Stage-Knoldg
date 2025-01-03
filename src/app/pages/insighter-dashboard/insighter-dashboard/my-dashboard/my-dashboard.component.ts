import { Component, Injector } from '@angular/core';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-my-dashboard',
  templateUrl: './my-dashboard.component.html',
  styleUrl: './my-dashboard.component.scss'
})
export class MyDashboardComponent extends BaseComponent {
  roles: any[] = [];
constructor(injector: Injector,private profileService: ProfileService){
  super(injector);
}

ngOnInit(){
  const sub=this.profileService.getProfile().subscribe((res: any) => {
    this.roles = res.roles;
  });
  this.unsubscribe.push(sub);
}

hasRole(role: string){
  return this.roles.includes(role);
}

}

