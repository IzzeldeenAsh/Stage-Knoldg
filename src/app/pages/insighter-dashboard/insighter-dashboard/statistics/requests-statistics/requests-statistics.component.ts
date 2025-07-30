import { Component, Injector } from '@angular/core';
import { UserRequestsService } from 'src/app/_fake/services/user-requests/user-requests.service';
import { BaseComponent } from 'src/app/modules/base.component';
import { forkJoin } from 'rxjs';
import { IKnoldgProfile } from 'src/app/_fake/models/profile.interface';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';

@Component({
  selector: 'app-requests-statistics',
  templateUrl: './requests-statistics.component.html',
  styleUrl: './requests-statistics.component.scss'
})
export class RequestsStatisticsComponent extends BaseComponent {
constructor(injector: Injector, private requests:UserRequestsService, private profileService:ProfileService){
  super(injector);
}
userProfile:IKnoldgProfile | null = null;
ngOnInit(){
  this.getProfile();
  this.getRequestsStatistics();
}

getProfile(){
  this.profileService.getProfile().subscribe((profile:IKnoldgProfile)=>{
    this.userProfile = profile;
  });
}

public pendingRequests: number = 0;
public approvedRequests: number = 0;
public declinedRequests: number = 0;

getRequestsStatistics(){
  // Use forkJoin to fetch both user requests and insighter requests simultaneously
  const requestsToFetch: any = {
    userRequests: this.requests.getAllUserRequests(this.lang ? this.lang : 'en')
  };
  
  // Only fetch insighter requests if user has company role
  if (this.userProfile?.roles.includes('company')) {
    requestsToFetch.insighterRequests = this.requests.getInsighterRequests(this.lang ? this.lang : 'en');
  }
  
  const sub = forkJoin(requestsToFetch).subscribe({
    next: (response: any) => {
      // Reset counters
      this.pendingRequests = 0;
      this.approvedRequests = 0;
      this.declinedRequests = 0;

      // Combine both arrays of requests
      const allRequests = [...(response.userRequests || []), ...(response.insighterRequests || [])];

      // Count only parent requests (parent_id === 0 or undefined)
      allRequests.forEach((request: any) => {
        // Only count parent requests, not children
        if (request.parent_id === 0 || request.parent_id === null || request.parent_id === undefined) {
          switch (request.final_status?.toLowerCase()) {
            case 'pending':
              this.pendingRequests++;
              break;
            case 'approved':
              this.approvedRequests++;
              break;
            case 'declined':
              this.declinedRequests++;
              break;
          }
        }
      });
    },
    error: (error) => {
      console.error('Error fetching requests statistics:', error);
      // Reset counters on error
      this.pendingRequests = 0;
      this.approvedRequests = 0;
      this.declinedRequests = 0;
    }
  });
  
  this.unsubscribe.push(sub);
}

}
