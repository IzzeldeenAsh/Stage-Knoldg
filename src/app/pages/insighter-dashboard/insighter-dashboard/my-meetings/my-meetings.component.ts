import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { MeetingsService, Meeting, MeetingResponse } from '../../../../_fake/services/meetings/meetings.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-my-meetings',
  templateUrl: './my-meetings.component.html',
  styleUrls: ['./my-meetings.component.scss']
})
export class MyMeetingsComponent implements OnInit, OnDestroy {
  meetings: Meeting[] = [];
  loading = false;
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  perPage = 10;
  
  // Filter tabs
  selectedTab: 'pending' | 'approved' | 'postponed' | 'upcoming' | 'past' = 'upcoming';
  
  // Dialog properties
  selectedMeeting: Meeting | null = null;
  approveNotes = '';
  postponeNotes = '';
  actionLoading = false;
  showApproveDialog = false;
  showPostponeDialog = false;
  
  // Math reference for template
  Math = Math;
  
  private destroy$ = new Subject<void>();

  constructor(private meetingsService: MeetingsService, private router: Router) { }

  ngOnInit(): void {
    this.loadMeetings();
    
    // Subscribe to loading state
    this.meetingsService.isLoading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading = loading);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  goToClientProfile(meeting: Meeting): void {
  if (meeting.client.uuid) {
    this.router.navigate(['/app/insighter-dashboard/client-profile', meeting.client.uuid]);
  } 
  }

  loadMeetings(page: number = 1): void {
    this.currentPage = page;
    const dateStatus = this.getDateStatusFilter();
    this.meetingsService.getMeetings(page, this.perPage, dateStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: MeetingResponse) => {
          this.meetings = response.data;
          this.totalPages = response.meta.last_page;
          this.totalItems = response.meta.total;
          this.currentPage = response.meta.current_page;
        },
        error: (error) => {
          console.error('Error loading meetings:', error);
        }
      });
  }

  onTabChange(tab: 'pending' | 'approved' | 'postponed' | 'upcoming' | 'past'): void {
    this.selectedTab = tab;
    // Reload meetings with the new filter
    this.loadMeetings(1);
  }

  getDateStatusFilter(): string | undefined {
    if (this.selectedTab === 'upcoming') {
      return 'upcoming';
    } else if (this.selectedTab === 'past') {
      return 'past';
    }
    return undefined;
  }

  getFilteredMeetings(): Meeting[] {
    let filteredMeetings: Meeting[] = [];
    
    // For date-based tabs (upcoming/past), the filtering is done on the backend
    if (this.selectedTab === 'upcoming' || this.selectedTab === 'past') {
      filteredMeetings = this.meetings;
    } else {
      // For status-based tabs (pending, approved, postponed)
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

  getInitials(firstName: string, lastName: string): string {
    return this.meetingsService.getInitials(firstName, lastName);
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

  isClosestMeeting(meeting: Meeting, index: number): boolean {
    const filteredMeetings = this.getFilteredMeetings();
    // Only the first meeting (closest) gets the orange color
    return index === 0 && filteredMeetings.length > 0;
  }

  openApproveModal(meeting: Meeting): void {
    console.log('Opening approve modal for meeting:', meeting);
    console.log('Meeting UUID:', meeting.uuid);
    this.selectedMeeting = meeting;
    this.approveNotes = '';
    this.showApproveDialog = true;
  }

  openPostponeModal(meeting: Meeting): void {
    console.log('Opening postpone modal for meeting:', meeting);
    console.log('Meeting UUID:', meeting.uuid);
    this.selectedMeeting = meeting;
    this.postponeNotes = '';
    this.showPostponeDialog = true;
  }

  closeApproveDialog(): void {
    this.showApproveDialog = false;
    this.selectedMeeting = null;
    this.approveNotes = '';
  }

  closePostponeDialog(): void {
    this.showPostponeDialog = false;
    this.selectedMeeting = null;
    this.postponeNotes = '';
  }

  approveMeeting(): void {
    if (!this.selectedMeeting ) {
      return;
    }

    console.log('Approving meeting - selectedMeeting:', this.selectedMeeting);
    console.log('Meeting UUID being sent:', this.selectedMeeting.uuid);

    this.actionLoading = true;
    this.meetingsService.updateMeetingStatus(
      this.selectedMeeting.uuid,
      'approved',
      this.approveNotes.trim()
    ).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.actionLoading = false;
        // Update the meeting status in the local array
        const meetingIndex = this.meetings.findIndex(m => m.uuid === this.selectedMeeting!.uuid);
        if (meetingIndex !== -1) {
          this.meetings[meetingIndex].status = 'approved';
        }
        
        // Close dialog
        this.showApproveDialog = false;
        
        // Reset form
        this.selectedMeeting = null;
        this.approveNotes = '';
        
        // Show success message (you can add a toast notification here)
        console.log('Meeting approved successfully');
      },
      error: (error: any) => {
        this.actionLoading = false;
        console.error('Error approving meeting:', error);
        // Show error message (you can add a toast notification here)
      }
    });
  }

  postponeMeeting(): void {
    if (!this.selectedMeeting || !this.postponeNotes.trim()) {
      return;
    }

    console.log('Postponing meeting - selectedMeeting:', this.selectedMeeting);
    console.log('Meeting UUID being sent:', this.selectedMeeting.uuid);

    this.actionLoading = true;
    this.meetingsService.updateMeetingStatus(
      this.selectedMeeting.uuid,
      'postponed',
      this.postponeNotes.trim()
    ).pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        this.actionLoading = false;
        // Update the meeting status in the local array
        const meetingIndex = this.meetings.findIndex(m => m.uuid === this.selectedMeeting!.uuid);
        if (meetingIndex !== -1) {
          this.meetings[meetingIndex].status = 'postponed';
        }
        
        // Close dialog
        this.showPostponeDialog = false;
        
        // Reset form
        this.selectedMeeting = null;
        this.postponeNotes = '';
        
        // Show success message (you can add a toast notification here)
        console.log('Meeting postponed successfully');
      },
      error: (error: any) => {
        this.actionLoading = false;
        console.error('Error postponing meeting:', error);
        // Show error message (you can add a toast notification here)
      }
    });
  }
} 