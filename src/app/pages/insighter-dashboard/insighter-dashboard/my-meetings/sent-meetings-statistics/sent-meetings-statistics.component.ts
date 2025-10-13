import { Component, inject, Injector, OnInit, OnDestroy } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';
import { SentMeetingsService, SentMeeting } from '../../../../../_fake/services/meetings/sent-meetings.service';
import { Observable, Subject, takeUntil } from 'rxjs';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';

@Component({
  selector: 'app-sent-meetings-statistics',
  templateUrl: './sent-meetings-statistics.component.html',
  styleUrls: ['./sent-meetings-statistics.component.scss']
})
export class SentMeetingsStatisticsComponent extends BaseComponent implements OnInit, OnDestroy {
  totalMeetings = 0;
  pendingMeetings = 0;
  approvedMeetings = 0;
  postponedMeetings = 0;
  upcomingMeetings = 0;
  pastMeetings = 0;
  loading = false;
  comingMeetings = 0;
  isClient$: Observable<any>;

  private destroy$ = new Subject<void>();

  constructor(
    injector: Injector,
    private sentMeetingsService: SentMeetingsService,
    private profileService: ProfileService,
  ) { 
    super(injector);
  }

  ngOnInit(): void {
    // this.loadStatistics();
    this.isClient$ = this.profileService.isClient()

    // Subscribe to loading state
    this.sentMeetingsService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading = loading);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadStatistics(): void {
    this.sentMeetingsService.getSentMeetings(1, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.totalMeetings = response.meta.total;
          this.calculateStatistics(response.data);

          // Load upcoming meetings
          this.sentMeetingsService.getSentMeetings(1, 100, 'upcoming')
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (upcomingResponse) => {
                this.upcomingMeetings = upcomingResponse.meta.total;

                // Calculate coming meetings as pending + upcoming
                this.comingMeetings = this.upcomingMeetings + this.approvedMeetings;
              },
              error: (error) => {
                console.error('Error loading upcoming meetings:', error);
              }
            });

          // Load past meetings
          this.loadPastMeetings();
        },
        error: (error) => {
          console.error('Error loading sent meeting statistics:', error);
        }
      });
  }

  private loadUpcomingMeetings(): void {
    this.sentMeetingsService.getSentMeetings(1, 100, 'upcoming')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.upcomingMeetings = response.meta.total;
        },
        error: (error) => {
          console.error('Error loading upcoming meetings:', error);
        }
      });
  }

  private loadPastMeetings(): void {
    this.sentMeetingsService.getSentMeetings(1, 100, 'past')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.pastMeetings = response.meta.total;
        },
        error: (error) => {
          console.error('Error loading past meetings:', error);
        }
      });
  }

  private calculateStatistics(meetings: SentMeeting[]): void {
    this.pendingMeetings = meetings.filter(m => m.status === 'pending').length;
    this.approvedMeetings = meetings.filter(m => m.status === 'approved').length;
    this.postponedMeetings = meetings.filter(m => m.status === 'postponed').length;
    
    this.comingMeetings = this.approvedMeetings + this.upcomingMeetings;
  }
} 