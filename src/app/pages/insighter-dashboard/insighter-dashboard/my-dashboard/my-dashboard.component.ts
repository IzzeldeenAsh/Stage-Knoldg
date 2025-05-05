import { Component, Injector, ViewChild } from '@angular/core';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { BaseComponent } from 'src/app/modules/base.component';
import { UserRequestsService } from 'src/app/_fake/services/user-requests/user-requests.service';
import { KnowledgeTypesStatisticsComponent } from './knowledge-types-statistics/knowledge-types-statistics.component';
import { KnowledgeService } from 'src/app/_fake/services/knowledge/knowledge.service';

@Component({
  selector: 'app-my-dashboard',
  templateUrl: './my-dashboard.component.html',
  styleUrl: './my-dashboard.component.scss'
})
export class MyDashboardComponent extends BaseComponent {
  roles: any[] = [];
  hasPendingActivationRequest: boolean = false;
  hasPendingInsighterRequests: boolean = false;
  pendingInsighterRequestsCount: number = 0;
  private statisticsLoaded: boolean = false;
  hasMultipleEmployees: boolean = false;
  hasEmployeeData: boolean = false;
  private knowledgeTypesLoaded: boolean = false;

constructor(
  injector: Injector,
  private profileService: ProfileService,
  private userRequestsService: UserRequestsService,
  private knowledgeService: KnowledgeService
){
  super(injector);
}

ngOnInit(){
  const profileSub = this.profileService.getProfile().subscribe((res: any) => {
    this.roles = res.roles;
    
    // Check for pending insighter requests only for company role
    if (this.roles.includes('company')) {
      this.checkPendingInsighterRequests();
    }
  });
  this.unsubscribe.push(profileSub);

  // Check if user has a pending activation request
  const requestsSub = this.userRequestsService.getAllUserRequests(this.lang).subscribe((requests) => {
    this.hasPendingActivationRequest = requests.some(
      request => request.type.key === 'activate_company' && request.status === 'pending'
    );
  });
  this.unsubscribe.push(requestsSub);

  // Check if there are statistics
  const statsSub = this.knowledgeService.getKnowledgeTypeStatistics().subscribe(
    (response) => {
      this.statisticsLoaded = response.data && response.data.length > 0;
      this.knowledgeTypesLoaded = this.statisticsLoaded;
    },
    () => {
      this.statisticsLoaded = false;
      this.knowledgeTypesLoaded = false;
    }
  );
  this.unsubscribe.push(statsSub);
}

// Handle the event when the number of employees is determined
onHasMultipleEmployees(hasMultiple: boolean): void {
  this.hasMultipleEmployees = hasMultiple;
  this.hasEmployeeData = hasMultiple;
}

hasRole(role: string){
  return this.roles.includes(role);
}

hasStatistics(): boolean {
  return this.statisticsLoaded;
}

/**
 * Check if knowledge types statistics are available
 */
hasKnowledgeTypes(): boolean {
  return this.knowledgeTypesLoaded;
}

/**
 * Determine if the empty state message should be shown
 * Only show empty state when there are no statistics, no employee data, and no pending insighter requests
 */
shouldShowEmptyState(): boolean {
  return !this.hasStatistics() && !this.hasEmployeeData && !this.hasPendingInsighterRequests;
}

/**
 * Check if there are pending insighter requests for company users
 */
checkPendingInsighterRequests(): void {
  const insighterRequestsSub = this.userRequestsService.getInsighterRequests(this.lang).subscribe((requests) => {
    const pendingRequests = requests.filter(request => request.status === 'pending');
    this.pendingInsighterRequestsCount = pendingRequests.length;
    this.hasPendingInsighterRequests = this.pendingInsighterRequestsCount > 0;
  });
  this.unsubscribe.push(insighterRequestsSub);
}

}

