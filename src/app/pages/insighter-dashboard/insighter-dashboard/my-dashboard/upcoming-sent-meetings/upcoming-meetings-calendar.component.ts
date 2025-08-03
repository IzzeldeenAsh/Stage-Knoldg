import { Component, OnInit, OnDestroy, Injector } from '@angular/core';
import { Subject, combineLatest, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MeetingsService, Meeting } from 'src/app/_fake/services/meetings/meetings.service';
import { SentMeetingsService, SentMeeting } from 'src/app/_fake/services/meetings/sent-meetings.service';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { BaseComponent } from 'src/app/modules/base.component';

interface CalendarDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  meetings: (Meeting | SentMeeting)[];
  isToday: boolean;
}

interface CalendarMeeting {
  uuid: string;
  title: string;
  startTime: string;
  endTime: string;
  participantName: string;
  participantAvatar: string | null;
  type: 'sent' | 'received';
  meetingUrl: string;
}

@Component({
  selector: 'app-upcoming-meetings-calendar',
  templateUrl: './upcoming-meetings-calendar.component.html',
  styleUrls: ['./upcoming-meetings-calendar.component.scss']
})
export class UpcomingMeetingsCalendarComponent extends BaseComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  weekDays: CalendarDay[] = [];
  currentWeekStart: Date = new Date();
  isLoading = false;
  userRoles: string[] = [];

  constructor(
    injector: Injector,
    private meetingsService: MeetingsService,
    private sentMeetingsService: SentMeetingsService,
    private profileService: ProfileService
  ) {
    super(injector);
  }

  ngOnInit() {
    this.getUserRoles();
    this.initializeWeek();
    this.loadMeetings();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getUserRoles() {
    combineLatest([
      this.profileService.isInsighter(),
      this.profileService.isCompany(), 
      this.profileService.isCompanyInsighter(),
      this.profileService.isClient()
    ]).pipe(takeUntil(this.destroy$))
    .subscribe(([isInsighter, isCompany, isCompanyInsighter, isClient]) => {
      this.userRoles = [];
      if (isInsighter) this.userRoles.push('insighter');
      if (isCompany) this.userRoles.push('company');
      if (isCompanyInsighter) this.userRoles.push('company-insighter');
      if (isClient) this.userRoles.push('client');
    });
  }

  private initializeWeek() {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    this.currentWeekStart = startOfWeek;
    
    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      this.weekDays.push({
        date: date,
        dayName: date.toLocaleDateString(this.lang === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'long' }),
        dayNumber: date.getDate(),
        meetings: [],
        isToday: this.isSameDay(date, today)
      });
    }
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  private loadMeetings() {
    this.isLoading = true;
    const meetingRequests: Observable<any>[] = [];
    
    // Always load sent meetings (available for all roles)
    meetingRequests.push(this.sentMeetingsService.getSentMeetings(1, 50, 'upcoming'));
    
    // Load received meetings only for insighter, company, and company-insighter roles
    if (this.userRoles.some(role => ['insighter', 'company', 'company-insighter'].includes(role))) {
      meetingRequests.push(this.meetingsService.getMeetings(1, 50, 'upcoming'));
    }
    
    combineLatest(meetingRequests)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (responses) => {
          const allMeetings: (Meeting | SentMeeting)[] = [];
          
          // Process sent meetings
          if (responses[0]?.data) {
            const approvedSentMeetings = responses[0].data.filter((m: SentMeeting) => m.status === 'approved');
            allMeetings.push(...approvedSentMeetings);
          }
          
          // Process received meetings (if available)
          if (responses[1]?.data) {
            const approvedReceivedMeetings = responses[1].data.filter((m: Meeting) => m.status === 'approved');
            allMeetings.push(...approvedReceivedMeetings);
          }
          
          this.distributeMeetingsToWeek(allMeetings);
          this.isLoading = false;
        },
        error: (error) => {
          this.handleServerErrors(error);
          this.isLoading = false;
        }
      });
  }

  private distributeMeetingsToWeek(meetings: (Meeting | SentMeeting)[]) {
    // Clear existing meetings
    this.weekDays.forEach(day => day.meetings = []);
    
    meetings.forEach(meeting => {
      const meetingDate = new Date(meeting.date);
      const dayIndex = this.weekDays.findIndex(day => this.isSameDay(day.date, meetingDate));
      
      if (dayIndex >= 0) {
        this.weekDays[dayIndex].meetings.push(meeting);
      }
    });
    
    // Sort meetings by start time for each day
    this.weekDays.forEach(day => {
      day.meetings.sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
  }

  private handleServerErrors(error: any) {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          this.showError(
            this.lang === 'ar' ? 'حدث خطأ' : 'An error occurred',
            messages.join(', ')
          );
        }
      }
    } else {
      this.showError(
        this.lang === 'ar' ? 'حدث خطأ' : 'An error occurred',
        this.lang === 'ar' ? 'حدث خطأ في تحميل الاجتماعات' : 'Failed to load meetings'
      );
    }
  }

  isSentMeeting(meeting: Meeting | SentMeeting): meeting is SentMeeting {
    return 'insighter' in meeting;
  }

  getParticipantName(meeting: Meeting | SentMeeting): string {
    if (this.isSentMeeting(meeting)) {
      return meeting.insighter.name;
    }
    return meeting.client.name;
  }

  getParticipantAvatar(meeting: Meeting | SentMeeting): string | null {
    if (this.isSentMeeting(meeting)) {
      return meeting.insighter.profile_photo_url;
    }
    return meeting.client.profile_photo_url;
  }

  getParticipantInitials(meeting: Meeting | SentMeeting): string {
    const name = this.getParticipantName(meeting);
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0].charAt(0).toUpperCase() + parts[1].charAt(0).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  }

  getMeetingTypeColor(meeting: Meeting | SentMeeting): string {
    return this.isSentMeeting(meeting) ? 'info' : 'success';
  }

  getCurrentMonth(): string {
    return this.currentWeekStart.toLocaleDateString(this.lang === 'ar' ? 'ar-EG' : 'en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  }

  getTotalMeetingsThisWeek(): number {
    return this.weekDays.reduce((total, day) => total + day.meetings.length, 0);
  }

  openMeetingUrl(meeting: Meeting | SentMeeting) {
    if (meeting.meeting_url && meeting.meeting_url !== '?pwd=') {
      window.open(meeting.meeting_url, '_blank');
    }
  }

  canJoinMeeting(meeting: Meeting | SentMeeting): boolean {
    return !!(meeting.meeting_url && meeting.meeting_url !== '?pwd=');
  }

  trackByMeetingId(index: number, meeting: Meeting | SentMeeting): string {
    return meeting.uuid;
  }
}