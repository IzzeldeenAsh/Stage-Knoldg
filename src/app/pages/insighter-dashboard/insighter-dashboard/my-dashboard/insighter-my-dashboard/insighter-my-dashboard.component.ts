import { Component, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { IKnoldgProfile } from 'src/app/_fake/models/profile.interface';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { AgreementService } from 'src/app/_fake/services/agreement/agreement.service';
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
  needsAgreement: boolean = false;
  showAgreementModal: boolean = false;
  constructor(
    injector: Injector,
    private profileService: ProfileService,
    private agreementService: AgreementService
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.profileService.getProfile().subscribe((profile: IKnoldgProfile) => {
      this.profile = profile;
      this.isCompanyInsight = this.profileService.isCompanyInsighter();
      // Check if there's a pending activation request based on profile status
      this.hasPendingActivationRequest = this.profile.status === 'pending' || this.profile.status === 'under_review';
    }); 
    // Check if user accepted the latest agreement
    this.agreementService.checkLatestAgreement().subscribe({
      next: (accepted) => {
        this.needsAgreement = !accepted;
      },
      error: () => {
        // if check fails, do not block UI; optionally show the banner
        this.needsAgreement = true;
      }
    });
  }

  isActiveInsighter(): boolean {
    return this.profile.status === 'active';
  }

  hasStatistics(event: boolean) {
    this.userHasStatistics = event;
}
  openAgreementModal(): void {
    this.showAgreementModal = true;
  }
  onAgreementAccepted(): void {
    this.needsAgreement = false;
    this.showAgreementModal = false;
  }
  onAgreementCancelled(): void {
    this.showAgreementModal = false;
  }
}