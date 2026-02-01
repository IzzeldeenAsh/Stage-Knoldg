import { Component, Injector, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-my-dashboard',
  templateUrl: './my-dashboard.component.html',
  styleUrl: './my-dashboard.component.scss'
})
export class MyDashboardComponent extends BaseComponent implements OnDestroy {

constructor(
  injector: Injector,
  private profileService: ProfileService,
){
  super(injector);
}

ngOnInit(){
}

ngOnDestroy(): void {

}

isClient(): Observable<any>{
  return this.profileService.isClient();
}

isInsighter(): Observable<any>{
  return this.profileService.isInsighter();
}

isCompanyInsighter(): Observable<any>{
  return this.profileService.isCompanyInsighter();
}

isCompany(): Observable<any>{
  return this.profileService.isCompany();
}

}

