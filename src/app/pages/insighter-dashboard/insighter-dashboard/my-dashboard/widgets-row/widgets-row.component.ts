import { Component, Injector, Input, OnInit } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';
import { UserRequestsService } from 'src/app/_fake/services/user-requests/user-requests.service';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { IKnoldgProfile } from 'src/app/_fake/models/profile.interface';
import { MeetingsService, ClientMeetingStatistics } from 'src/app/_fake/services/meetings/meetings.service';
import { WalletService } from 'src/app/_fake/services/wallet/wallet.service';

@Component({
  selector: 'app-widgets-row',
  templateUrl: './widgets-row.component.html',
  styleUrl: './widgets-row.component.scss'
})
export class WidgetsRowComponent extends BaseComponent implements OnInit {

  @Input() userRole: string = '';
  todayMeetingsCount: number = 0;
  
  pendingRequestsCount: number = 0;
  userProfile: IKnoldgProfile | null = null;
  private destroy$ = new Subject<void>();
  
  
  // Wallet balance
  walletBalance: number = 0;
  
  constructor(
    injector: Injector,
    private requestsService: UserRequestsService,
    private profileService: ProfileService,
    private meetingsService: MeetingsService,
    private walletService: WalletService
  ) {
    super(injector)
  }
  
  ngOnInit(): void {
    this.getProfile();
    this.loadMeetingStatistics();
    this.loadWalletBalance();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  getProfile(): void {
    this.profileService.getProfile().subscribe((profile: IKnoldgProfile) => {
      this.userProfile = profile;
      this.getRequestsStatistics();
    });
  }
  
  getRequestsStatistics(): void {
    // Use forkJoin to fetch both user requests and insighter requests simultaneously
    const requestsToFetch: any = {
      userRequests: this.requestsService.getAllUserRequests(this.lang ? this.lang : 'en')
    };
    
    // Only fetch insighter requests if user has company role
    if (this.userProfile?.roles.includes('company')) {
      requestsToFetch.insighterRequests = this.requestsService.getInsighterRequests(this.lang ? this.lang : 'en');
    }
    
    forkJoin(requestsToFetch).subscribe({
      next: (response: any) => {
        // Reset counter
        this.pendingRequestsCount = 0;

        // Combine both arrays of requests
        const allRequests = [...(response.userRequests || []), ...(response.insighterRequests || [])];

        // Count only parent requests (parent_id === 0 or undefined) with pending status
        allRequests.forEach((request: any) => {
          // Only count parent requests, not children
          if (request.parent_id === 0 || request.parent_id === null || request.parent_id === undefined) {
            if (request.final_status?.toLowerCase() === 'pending') {
              this.pendingRequestsCount++;
            }
          }
        });
      },
      error: (error) => {
        console.error('Error fetching requests statistics:', error);
        this.pendingRequestsCount = 0;
      }
    });
  }
  
  loadMeetingStatistics(): void {
    this.meetingsService.getClientMeetingStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: { data: ClientMeetingStatistics }) => {
          this.todayMeetingsCount = response.data.today;
          console.log('Today\'s meetings count from API:', this.todayMeetingsCount);
        },
        error: (error) => {
          console.error('Error loading meeting statistics:', error);
          this.todayMeetingsCount = 0;
        }
      });
  }
  
  loadWalletBalance(): void {
    this.walletService.getBalance()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (balance: number) => {
          this.walletBalance = balance;
          console.log('Wallet balance loaded:', this.walletBalance);
        },
        error: (error) => {
          console.error('Error loading wallet balance:', error);
          this.walletBalance = 0;
        }
      });
  }
}
