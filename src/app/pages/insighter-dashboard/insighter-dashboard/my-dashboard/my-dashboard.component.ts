import { Component, Injector, ViewChild, OnDestroy } from '@angular/core';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { BaseComponent } from 'src/app/modules/base.component';
import { UserRequestsService } from 'src/app/_fake/services/user-requests/user-requests.service';
import { KnowledgeTypesStatisticsComponent } from './knowledge-types-statistics/knowledge-types-statistics.component';
import { KnowledgeService } from 'src/app/_fake/services/knowledge/knowledge.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-my-dashboard',
  templateUrl: './my-dashboard.component.html',
  styleUrl: './my-dashboard.component.scss'
})
export class MyDashboardComponent extends BaseComponent implements OnDestroy {
  roles: any[] = [];
  hasPendingActivationRequest: boolean = false;
  hasPendingInsighterRequests: boolean = false;
  pendingInsighterRequestsCount: number = 0;
  private statisticsLoaded: boolean = false;
  hasMultipleEmployees: boolean = false;
  hasEmployeeData: boolean = false;
  private knowledgeTypesLoaded: boolean = false;
  insighterStatus: string = '';
  isLoading: boolean = true;
  isClientOnly: Observable<any>;
  hasMultipleEmployeesDonut: boolean = false;
  
  // Loading state trackers
  private profileLoaded: boolean = false;
  private requestsLoaded: boolean = false;
  private statisticsApiLoaded: boolean = false;
  private insighterRequestsLoaded: boolean = false;
  private loadingTimeout: any;
constructor(
  injector: Injector,
  private profileService: ProfileService,
  private userRequestsService: UserRequestsService,
  private knowledgeService: KnowledgeService
){
  super(injector);
}

ngOnInit(){
  this.isLoading = true;
  
  // Safety timeout to prevent infinite loading (30 seconds)
  this.loadingTimeout = setTimeout(() => {
    if (this.isLoading) {
      console.warn('Loading timeout reached - forcing loading to complete');
      console.warn('Loading states:', {
        profileLoaded: this.profileLoaded,
        requestsLoaded: this.requestsLoaded,
        statisticsApiLoaded: this.statisticsApiLoaded,
        insighterRequestsLoaded: this.insighterRequestsLoaded
      });
      this.isLoading = false;
    }
  }, 30000);
  
  this.isClientOnly= this.profileService.isClient();
  const profileSub = this.profileService.getProfile().subscribe({
    next: (res: any) => {
      this.roles = res.roles;
      this.insighterStatus = res.insighter_status || '';
      this.profileLoaded = true;
      
      // Initialize hasEmployeeData to true if user has company role
      // This allows the employee statistics component to load and determine if there's enough data
      this.hasEmployeeData = this.roles.includes('company');
      
      
      // Check for pending insighter requests only for company role
      if (this.roles.includes('company')) {
        this.checkPendingInsighterRequests();
      } else {
        this.insighterRequestsLoaded = true; // Skip this check for non-company users
      }
      
      this.checkLoadingComplete();
    },
    error: (error) => {
      console.error('Error loading profile:', error);
      this.profileLoaded = true; // Mark as loaded even on error to prevent infinite loading
      this.insighterRequestsLoaded = true; // Skip insighter requests check on profile error
      this.checkLoadingComplete();
    }
  });
  this.unsubscribe.push(profileSub);

  // Check if user has a pending activation request
  const requestsSub = this.userRequestsService.getAllUserRequests(this.lang).subscribe({
    next: (requests) => {
      this.hasPendingActivationRequest = requests.some(
        request => request.type.key === 'activate_company' && request.status === 'pending'
      );
      this.requestsLoaded = true;
      this.checkLoadingComplete();
    },
    error: (error) => {
      console.error('Error loading user requests:', error);
      this.requestsLoaded = true; // Mark as loaded even on error
      this.checkLoadingComplete();
    }
  });
  this.unsubscribe.push(requestsSub);

  // Check if there are statistics
  const statsSub = this.knowledgeService.getKnowledgeTypeStatistics().subscribe({
    next: (response) => {
      this.statisticsLoaded = response.data && response.data.length > 0;
      this.knowledgeTypesLoaded = this.statisticsLoaded;
      this.statisticsApiLoaded = true;
      this.checkLoadingComplete();
    },
    error: (error) => {
      console.error('Error loading knowledge statistics:', error);
      this.statisticsLoaded = false;
      this.knowledgeTypesLoaded = false;
      this.statisticsApiLoaded = true;
      this.checkLoadingComplete();
    }
  });
  this.unsubscribe.push(statsSub);
}

ngOnDestroy(): void {
  // Clear the safety timeout if it exists
  if (this.loadingTimeout) {
    clearTimeout(this.loadingTimeout);
    this.loadingTimeout = null;
  }
  
  // Call parent destroy (handles unsubscribe)
  super.ngOnDestroy();
}

/**
 * Check if all data loading is complete
 */
private checkLoadingComplete(): void {

  // Only mark loading as complete when all required data has been loaded
  if (this.profileLoaded && this.requestsLoaded && 
      this.statisticsApiLoaded && this.insighterRequestsLoaded) {
    this.isLoading = false;
    
    // Clear the safety timeout
    if (this.loadingTimeout) {
      clearTimeout(this.loadingTimeout);
      this.loadingTimeout = null;
    }
  }
}

// Handle the event when the number of employees is determined
onHasMultipleEmployees(hasMultiple: boolean): void {
  this.hasMultipleEmployees = hasMultiple;
  // Only update hasEmployeeData if there's not enough data
  // This prevents hiding the component if there's not enough data
  if (!hasMultiple) {
    this.hasEmployeeData = false;
  }
  this.checkLoadingComplete();

}

onHasMultipleEmployeesDonut(hasMultiple: boolean): void {
  this.hasMultipleEmployeesDonut = hasMultiple;
  this.checkLoadingComplete();
}

hasRole(role: string){
  return this.roles.includes(role);
}

/**
 * Check if user is an active insighter
 */
isActiveInsighter(): boolean {
  return this.hasRole('insighter') && this.insighterStatus === 'active';
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
 * Check if user can view knowledge types statistics (insighter or company-insighter roles)
 */
canViewKnowledgeTypesStatistics(): boolean {
  return this.hasRole('insighter') || this.hasRole('company-insighter');
}

/**
 * Check if user can view donut employee chart (company role only)
 */
canViewDonutEmployeeChart(): boolean {
  return this.hasRole('company') 
}

/**
 * Check if user can view employee knowledge statistics (company role + has employee data)
 */
canViewEmployeeKnowledgeStatistics(): boolean {
  return this.hasRole('company') && this.hasEmployeeData;
}

/**
 * Get column classes for knowledge types statistics
 */
getStatisticsColClass(): string {
  const hasCompanyCharts = this.canViewDonutEmployeeChart() || this.canViewEmployeeKnowledgeStatistics();
  return hasCompanyCharts ? 'col-12 col-lg-6' : 'col-12';
}

/**
 * Get column classes for employee statistics
 */
getEmployeeStatsColClass(): string {
  const hasOtherComponents = this.canViewKnowledgeTypesStatistics() || this.canViewDonutEmployeeChart();
  return hasOtherComponents ? 'col-12 col-lg-6' : 'col-12';
}

/**
 * Get column classes for donut chart
 */
getDonutChartColClass(): string {
  const hasOtherComponents = this.canViewKnowledgeTypesStatistics() || this.canViewEmployeeKnowledgeStatistics();
  return hasOtherComponents ? 'col-12 col-lg-6' : 'col-12';
}

/**
 * Determine if the empty state message should be shown
 * Only show empty state when there are no statistics, no employee data, and no pending insighter requests
 * AND loading is complete
 */
shouldShowEmptyState(): boolean {
  return !this.isLoading && !this.hasStatistics() && !this.hasEmployeeData && !this.hasPendingInsighterRequests;
}

/**
 * Check if there are pending insighter requests for company users
 */
checkPendingInsighterRequests(): void {
  const insighterRequestsSub = this.userRequestsService.getInsighterRequests(this.lang).subscribe({
    next: (requests) => {
      const pendingRequests = requests.filter(request => request.status === 'pending');
      this.pendingInsighterRequestsCount = pendingRequests.length;
      this.hasPendingInsighterRequests = this.pendingInsighterRequestsCount > 0;
      this.insighterRequestsLoaded = true;
      this.checkLoadingComplete();
    },
    error: (error) => {
      console.error('Error loading insighter requests:', error);
      this.insighterRequestsLoaded = true; // Mark as loaded even on error
      this.checkLoadingComplete();
    }
  });
  this.unsubscribe.push(insighterRequestsSub);
}

}

