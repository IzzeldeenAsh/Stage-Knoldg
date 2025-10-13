import { Component, inject, Injector, OnInit, OnDestroy } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';
import { MeetingsService, Meeting } from '../../../../../_fake/services/meetings/meetings.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-meetings-statistics',
  templateUrl: './meetings-statistics.component.html',
  styleUrls: ['./meetings-statistics.component.scss']
})
export class MeetingsStatisticsComponent extends BaseComponent implements OnInit, OnDestroy {
  totalMeetings = 0;
  pendingMeetings = 0;
  approvedMeetings = 0;
  postponedMeetings = 0;
  loading = false;

  private destroy$ = new Subject<void>();

  constructor(
    injector: Injector,
    private meetingsService: MeetingsService
  ) { 
    super(injector);
  }

  ngOnInit(): void {
    // this.loadStatistics();
    
    // Subscribe to loading state
    this.meetingsService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading = loading);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadStatistics(): void {
    // Load a larger page to get all meetings for statistics
    this.meetingsService.getMeetings(1, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.totalMeetings = response.meta.total;
          this.calculateStatistics(response.data);
        },
        error: (error) => {
          console.error('Error loading meeting statistics:', error);
        }
      });
  }

  private calculateStatistics(meetings: Meeting[]): void {
    this.pendingMeetings = meetings.filter(m => m.status === 'pending').length;
    this.approvedMeetings = meetings.filter(m => m.status === 'approved').length;
    this.postponedMeetings = meetings.filter(m => m.status === 'postponed').length;
  }
} 