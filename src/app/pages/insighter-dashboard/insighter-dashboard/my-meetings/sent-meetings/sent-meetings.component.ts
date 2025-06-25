import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { SentMeetingsService, SentMeeting, SentMeetingResponse } from '../../../../../_fake/services/meetings/sent-meetings.service';

@Component({
  selector: 'app-sent-meetings',
  templateUrl: './sent-meetings.component.html',
  styleUrls: ['./sent-meetings.component.scss']
})
export class SentMeetingsComponent implements OnInit, OnDestroy {
  meetings: SentMeeting[] = [];
  loading = false;
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  perPage = 10;
  
  // Filter tabs
  selectedTab: 'all' | 'pending' | 'approved' | 'postponed' = 'all';
  
  // Math reference for template
  Math = Math;
  
  private destroy$ = new Subject<void>();

  constructor(private sentMeetingsService: SentMeetingsService) { }

  ngOnInit(): void {
    this.loadMeetings();
    
    // Subscribe to loading state
    this.sentMeetingsService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading = loading);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMeetings(page: number = 1): void {
    this.currentPage = page;
    this.sentMeetingsService.getSentMeetings(page, this.perPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: SentMeetingResponse) => {
          this.meetings = response.data;
          this.totalPages = response.meta.last_page;
          this.totalItems = response.meta.total;
          this.currentPage = response.meta.current_page;
        },
        error: (error) => {
          console.error('Error loading sent meetings:', error);
        }
      });
  }

  onTabChange(tab: 'all' | 'pending' | 'approved' | 'postponed'): void {
    this.selectedTab = tab;
  }

  getFilteredMeetings(): SentMeeting[] {
    let filteredMeetings: SentMeeting[] = [];
    if (this.selectedTab === 'all') {
      filteredMeetings = this.meetings;
    } else {
      filteredMeetings = this.meetings.filter(meeting => meeting.status === this.selectedTab);
    }
    
    // Sort by date (closest meetings first)
    return filteredMeetings.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB;
    });
  }

  onPageChange(page: number): void {
    this.loadMeetings(page);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'postponed':
        return 'badge-secondary';
      default:
        return 'badge-primary';
    }
  }

  getInitials(name: string): string {
    return this.sentMeetingsService.getInitials(name);
  }

  formatTime(time: string): string {
    // Convert 24-hour time to 12-hour format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short'
    });
  }

  formatMonth(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short'
    });
  }

  formatDay(dateString: string): string {
    const date = new Date(dateString);
    return date.getDate().toString();
  }

  isClosestMeeting(meeting: SentMeeting, index: number): boolean {
    const filteredMeetings = this.getFilteredMeetings();
    // Only the first meeting (closest) gets the orange color
    return index === 0 && filteredMeetings.length > 0;
  }
} 