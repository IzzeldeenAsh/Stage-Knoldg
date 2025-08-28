import { Component, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { IKnoldgProfile } from 'src/app/_fake/models/profile.interface';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { BaseComponent } from 'src/app/modules/base.component';
@Component({
  selector: 'app-insighter-my-dashboard',
  templateUrl: './insighter-my-dashboard.component.html',
  styleUrl: './insighter-my-dashboard.component.scss'
})
export class InsighterMyDashboardComponent extends BaseComponent {
  profile: IKnoldgProfile;
  hasPendingActivationRequest: boolean = false;
  userHasStatistics: boolean = false;
  isCompanyInsight: Observable<boolean>;
  constructor(injector: Injector, private profileService: ProfileService) {
    super(injector);
  }

  ngOnInit(): void {
    this.profileService.getProfile().subscribe((profile: IKnoldgProfile) => {
      this.profile = profile;
      this.isCompanyInsight = this.profileService.isCompanyInsighter();
      // Check if there's a pending activation request based on profile status
      this.hasPendingActivationRequest = this.profile.status === 'pending' || this.profile.status === 'under_review';
    }); 
  }

  isActiveInsighter(): boolean {
    return this.profile.status === 'active';
  }


  hasStatistics(event: boolean) {
    this.userHasStatistics = event;
}
}