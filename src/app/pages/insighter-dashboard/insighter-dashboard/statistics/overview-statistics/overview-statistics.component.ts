import { Component, Injector } from '@angular/core';
import { IKnoldgProfile } from 'src/app/_fake/models/profile.interface';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { BaseComponent } from 'src/app/modules/base.component';
import { BreadcrumbItem } from 'src/app/reusable-components/dashboard-statistics/dashboard-statistics.component';

@Component({
  selector: 'app-overview-statistics',
  templateUrl: './overview-statistics.component.html',
  styleUrl: './overview-statistics.component.scss'
})
export class OverviewStatisticsComponent extends BaseComponent  {
  profile: IKnoldgProfile;
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', translationKey: 'DASHBOARD' }
  ];

  constructor(injector: Injector, private profileService: ProfileService){
    super(injector);
  }

  ngOnInit(): void {
    this.profileService.getProfile().subscribe((profile) => {
      this.profile = profile;
    });
  }

}
