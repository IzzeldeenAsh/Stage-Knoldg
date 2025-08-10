import { Component, Injector, OnInit, OnDestroy } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';
import { SentMeetingsService, SentMeeting, SentMeetingResponse } from 'src/app/_fake/services/meetings/sent-meetings.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-client-my-dashboard',
  templateUrl: './client-my-dashboard.component.html',
  styleUrl: './client-my-dashboard.component.scss'
})
export class ClientMyDashboardComponent extends BaseComponent implements OnInit, OnDestroy {
  todayMeetingsCount: number = 0;
  sentMeetings: SentMeeting[] = [];
  expertsCount: number = 1250;
  topIndustries: string[] = ['Technology', 'Healthcare', 'Finance', 'Education', 'Marketing'];
  knowledgeLinks = [
    { name: 'Data', type: 'data' },
    { name: 'Insight', type: 'insight' },
    { name: 'Manual', type: 'manual' },
    { name: 'Courses', type: 'course' },
    { name: 'Report', type: 'report' }
  ];
  private destroy$ = new Subject<void>();

  constructor(
    injector: Injector,
    private sentMeetingsService: SentMeetingsService
  ) {
    super(injector)
  }

  ngOnInit(): void {
    this.loadTodayMeetings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTodayMeetings(): void {
    this.sentMeetingsService.getSentMeetings(1, 30)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: SentMeetingResponse) => {
          this.sentMeetings = response.data;
          
          // Calculate number of today's meetings
          const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
          this.todayMeetingsCount = this.sentMeetings.filter(meeting => meeting.date === today).length;
        },
        error: (error) => {
          console.error("Error loading sent meetings:", error);
          this.todayMeetingsCount = 0;
        },
      });
  }

  redirectToExperts(): void {
    window.open('https://knoldg.com/en/home?search_type=insighter&accuracy=any', '_blank');
  }

  redirectToKnowledge(type: string): void {
    window.open(`https://knoldg.com/en/home?search_type=knowledge&type=${type}`, '_blank');
  }

}
