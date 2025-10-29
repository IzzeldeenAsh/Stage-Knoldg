import { Component, Injector, Input, OnInit } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';
import { UserRequestsService } from 'src/app/_fake/services/user-requests/user-requests.service';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { IKnoldgProfile } from 'src/app/_fake/models/profile.interface';
import { SentMeetingsService, SentMeeting, SentMeetingResponse } from 'src/app/_fake/services/meetings/sent-meetings.service';
import { MeetingsService, Meeting, MeetingResponse } from 'src/app/_fake/services/meetings/meetings.service';
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
  
  // Store meetings data
  sentMeetings: SentMeeting[] = [];
  receivedMeetings: Meeting[] = [];
  
  // Wallet balance
  walletBalance: number = 0;
  
  constructor(
    injector: Injector, 
    private requestsService: UserRequestsService,
    private profileService: ProfileService,
    private sentMeetingsService: SentMeetingsService,
    private meetingsService: MeetingsService,
    private walletService: WalletService
  ) {
    super(injector)
  }
  
  ngOnInit(): void {
    this.getProfile();
    this.loadAllMeetings();
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
  
  loadAllMeetings(page: number = 1): void {
    // Always get sent meetings
    const sentMeetingsRequest = this.sentMeetingsService.getSentMeetings(page, 30);
    
    // Prepare requests based on role
    if (this.userRole === 'client') {
      // For client role, only get sent meetings
      sentMeetingsRequest
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: SentMeetingResponse) => {
            this.sentMeetings = response.data;
            
            // Calculate number of today's meetings
            const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
            this.todayMeetingsCount = this.sentMeetings.filter(meeting => meeting.date === today).length;
            
            console.log('Today\'s sent meetings count:', this.todayMeetingsCount);
          },
          error: (error) => {
            console.error("Error loading sent meetings:", error);
          },
        });
    } else {
      // For other roles (company, insighter, etc.), get both sent and received meetings
      const receivedMeetingsRequest = this.meetingsService.getMeetings(page, 30);
      
      // Use forkJoin to execute both requests in parallel
      forkJoin({
        sent: sentMeetingsRequest,
        received: receivedMeetingsRequest
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responses) => {
          // Store both types of meetings
          this.sentMeetings = responses.sent.data;
          this.receivedMeetings = responses.received.data;
          
          // Calculate number of today's meetings from both sources
          const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
          
          const todaySentMeetings = this.sentMeetings.filter(meeting => meeting.date === today).length;
          const todayReceivedMeetings = this.receivedMeetings.filter(meeting => meeting.date === today).length;
          
          // Combine the counts
          this.todayMeetingsCount = todaySentMeetings + todayReceivedMeetings;
          
          console.log('Sent meetings today:', todaySentMeetings);
          console.log('Received meetings today:', todayReceivedMeetings);
          console.log('Total meetings today:', this.todayMeetingsCount);
        },
        error: (error) => {
          console.error("Error loading meetings:", error);
        },
      });
    }
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
