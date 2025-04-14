import { Component, Injector, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { first, Observable } from 'rxjs';
import { IKnoldgProfile } from 'src/app/_fake/models/profile.interface';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { UserRequestsService } from 'src/app/_fake/services/user-requests/user-requests.service';
import { UserRequest } from 'src/app/_fake/services/user-requests/user-requests.service';
import { BaseComponent } from 'src/app/modules/base.component';

// Extend the UserRequest interface to include knowledge_id
interface ExtendedUserRequest extends UserRequest {
  knowledge_id?: number;
  parent_id?: number;
}

@Component({
  selector: 'app-my-requests',
  templateUrl: './my-requests.component.html',
  styleUrl: './my-requests.component.scss'
})
export class MyRequestsComponent extends BaseComponent implements OnInit {
  userRequests: ExtendedUserRequest[] = [];
  filteredUserRequests: ExtendedUserRequest[] = [];
  insighterRequests: ExtendedUserRequest[] = [];
  filteredInsighterRequests: ExtendedUserRequest[] = [];
  isLoading$!: Observable<boolean>;
  selectedType: string = '';
  selectedStatus: string = '';
  selectedInsighterType: string = '';
  selectedInsighterStatus: string = '';
  resendComments: string = '';
  displayRequestDialog: boolean = false;
  selectedRequest: ExtendedUserRequest | null = null;
  userProfile: IKnoldgProfile | null = null;
  hasPendingRequestOfSameType: boolean = false;
  
  // Added properties for approve/decline functionality
  isInsighterRequest: boolean = false;
  isApproving: boolean = false;
  isDeclining: boolean = false;
  staffNotes: string = '';
  
  constructor(
    injector: Injector,
    private userRequestsService: UserRequestsService,
    private getProfileService: ProfileService,
    private router: Router
  ) {
    super(injector);
    this.isLoading$ = this.userRequestsService.isLoading$;
  }

  ngOnInit(): void {
    this.loadData();
    this.getProfile();
  }

  getProfile() {
    this.getProfileService.getProfile().pipe(first()).subscribe((user)=>{
      console.log('User profile loaded:', user);
      console.log('User roles:', user?.roles);
      this.userProfile=user
      // Load insighter requests for all users for now
      this.loadInsighterRequests();
    })
  }

  loadData() {
    this.userRequestsService.getAllUserRequests(this.lang).subscribe((requests) => {
      this.userRequests = requests;
      this.filterRequests();
    });
  }

  loadInsighterRequests() {
    console.log('Loading insighter requests...');
    this.userRequestsService.getInsighterRequests(this.lang).subscribe({
      next: (requests) => {
        console.log('Insighter requests loaded:', requests);
        this.insighterRequests = requests;
        this.filterInsighterRequests();
      },
      error: (error) => {
        console.error('Error loading insighter requests:', error);
      }
    });
  }

  filterRequests() {
    this.filteredUserRequests = this.userRequests.filter((request) => {
      const matchesType = this.selectedType ? request.type.key === this.selectedType : true;
      const matchesStatus = this.selectedStatus ? request.status === this.selectedStatus : true;
      return matchesType && matchesStatus;
    });
  }

  filterInsighterRequests() {
    console.log('Filtering insighter requests. Total count:', this.insighterRequests.length);
    console.log('Current filters - Type:', this.selectedInsighterType, 'Status:', this.selectedInsighterStatus);
    
    this.filteredInsighterRequests = this.insighterRequests.filter((request) => {
      const matchesType = this.selectedInsighterType ? request.type.key === this.selectedInsighterType : true;
      const matchesStatus = this.selectedInsighterStatus ? request.final_status === this.selectedInsighterStatus : true;
      return matchesType && matchesStatus;
    });
    
    console.log('Filtered insighter requests count:', this.filteredInsighterRequests.length);
  }

  openRequestDialog(request: ExtendedUserRequest) {
    const latestRequest = this.getLatestChild(request);
    this.selectedRequest = latestRequest;
    this.isInsighterRequest = false;
    
    // Check if there's already a pending request of the same type
    this.hasPendingRequestOfSameType = this.userRequests.some(req => 
      req.type.key === latestRequest.type.key && 
      req.final_status === 'pending' &&
      req.id !== latestRequest.id
    );
    
    this.displayRequestDialog = true;
  }

  openInsighterRequestDialog(request: ExtendedUserRequest) {
    const latestRequest = this.getLatestChild(request);
    
    this.selectedRequest = latestRequest;
    this.isInsighterRequest = true;
    
    // Reset action state
    this.isApproving = false;
    this.isDeclining = false;
    this.staffNotes = '';
    
    // Check if there's already a pending request of the same type
    this.hasPendingRequestOfSameType = this.insighterRequests.some(req => 
      req.type.key === latestRequest.type.key && 
      req.final_status === 'pending' &&
      req.id !== latestRequest.id
    );
    
    this.displayRequestDialog = true;
  }

  // Methods for approval/decline actions
  onApproveRequest() {
    this.isApproving = true;
    this.isDeclining = false;
  }

  onDeclineRequest() {
    this.isApproving = false;
    this.isDeclining = true;
  }

  cancelAction() {
    this.isApproving = false;
    this.isDeclining = false;
    this.staffNotes = '';
  }

  confirmAction() {
    if (!this.selectedRequest || !this.staffNotes.trim()) {
      return;
    }

    if (this.isApproving) {
      this.approveInsighterRequest();
    } else if (this.isDeclining) {
      this.declineInsighterRequest();
    }
  }

  // API calls for approve/decline
  approveInsighterRequest() {
    if (!this.selectedRequest || !this.staffNotes.trim()) return;

    const requestId = this.selectedRequest.id.toString();
    const status = "approved";

    this.userRequestsService.updateInsighterRequestStatus(requestId, status, this.staffNotes).subscribe({
      next: () => {
        this.showSuccess('Success', 'Request approved successfully');
        this.displayRequestDialog = false;
        this.loadInsighterRequests(); // Reload the data
        this.resetActionState();
      },
      error: (error: any) => {
        console.error('Error approving request:', error);
        this.showError('Error', 'Failed to approve request');
      }
    });
  }

  declineInsighterRequest() {
    if (!this.selectedRequest || !this.staffNotes.trim()) return;

    const requestId = this.selectedRequest.id.toString();
    const status = "declined";

    this.userRequestsService.updateInsighterRequestStatus(requestId, status, this.staffNotes).subscribe({
      next: () => {
        this.showSuccess('Success', 'Request declined successfully');
        this.displayRequestDialog = false;
        this.loadInsighterRequests(); // Reload the data
        this.resetActionState();
      },
      error: (error: any) => {
        console.error('Error declining request:', error);
        this.showError('Error', 'Failed to decline request');
      }
    });
  }

  resetActionState() {
    this.isApproving = false;
    this.isDeclining = false;
    this.staffNotes = '';
    this.selectedRequest = null;
  }

  viewFilteredStock() {
    // Implement based on your needs
  }

  private getLatestChild(request: ExtendedUserRequest): ExtendedUserRequest {
    let latest = request;

    if (request.children && request.children.length > 0) {
      for (const child of request.children as ExtendedUserRequest[]) {
        const candidate = this.getLatestChild(child);
        if (candidate.id > latest.id) {
          latest = candidate;
        }
      }
    }

    return latest;
  }

  onResendRequest() {
    if (this.selectedRequest?.id && this.resendComments.trim()) {
      // Use sendVerificationRequest if the request type is 'activate_company'
      if (this.selectedRequest.type.key === 'activate_company') {
        const sub = this.userRequestsService
          .sendActivationRequest(this.resendComments, this.selectedRequest.id.toString())
          .subscribe({
            next: () => {
              this.showSuccess('Success', 'Verification request resent successfully.');
              this.loadData();
              this.displayRequestDialog = false;
              this.resendComments = '';
            },
            error: (error) => {
              console.error('Error resending verification request:', error);
              this.showError('Error', 'Failed to resend verification request.');
            },
          });
        this.unsubscribe.push(sub);
      } else if(this.selectedRequest?.type.key === 'verified_company') {
        // Otherwise, keep using the original method
        const sub = this.userRequestsService
          .sendVerificationRequest(this.resendComments, this.selectedRequest.id.toString())
          .subscribe({
            next: () => {
              this.showSuccess('Success', 'Activation request resent successfully.');
              this.loadData();
              this.displayRequestDialog = false;
              this.resendComments = '';
            },
            error: (error) => {
              console.error('Error resending activation request:', error);
              this.showError('Error', 'Failed to resend activation request.');
            },
          });
        this.unsubscribe.push(sub);
      } else if(this.selectedRequest?.type.key === 'deactivate_delete_company'){
        const sub = this.userRequestsService
          .sendDeactivateAndDeleteRequest(this.resendComments, this.selectedRequest.id.toString())
          .subscribe({
            next: () => {
              this.showSuccess('Success', 'Deactivation request sent successfully.');
              this.loadData();
              this.displayRequestDialog = false;
              this.resendComments = '';
            },
          });
        this.unsubscribe.push(sub);
      }else if(this.selectedRequest?.type.key === 'deactivate_delete_insighter'){
        const sub = this.userRequestsService
          .sendDeactivateAndDeleteRequestInsighter(this.resendComments, this.selectedRequest.id.toString())
          .subscribe({
            next: () => {
              this.showSuccess('Success', 'Deactivation request sent successfully.');
              this.loadData();
              this.displayRequestDialog = false;
              this.resendComments = '';
            },
          });
        this.unsubscribe.push(sub);
      }
    }
  }

  // Navigate to review page for knowledge
  navigateToReview(): void {
    if (this.selectedRequest?.knowledge_id) {
      this.router.navigate(['/app/review-insighter-knowledge/review', this.selectedRequest.knowledge_id], {
        queryParams: { requestId: this.selectedRequest.id }
      });
      this.displayRequestDialog = false;
    }
  }
}
