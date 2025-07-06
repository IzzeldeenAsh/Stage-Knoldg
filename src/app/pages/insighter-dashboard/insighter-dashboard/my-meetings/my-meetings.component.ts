import { Component, OnInit, OnDestroy, inject, DestroyRef, signal } from '@angular/core';
import { Subject, take, takeUntil } from 'rxjs';
import { MeetingsService, Meeting, MeetingResponse } from '../../../../_fake/services/meetings/meetings.service';
import { Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TruncateTextPipe } from 'src/app/pipes/truncate-pipe/truncate-text.pipe';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslationModule } from 'src/app/modules/i18n';
import { BaseComponent } from 'src/app/modules/base.component';
type TabType = 'pending' | 'approved' | 'postponed' | 'upcoming' | 'past';
@Component({
  selector: 'app-my-meetings',
  templateUrl: './my-meetings.component.html',
  styleUrls: ['./my-meetings.component.scss'],
  standalone: true,
  imports : [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    TooltipModule,
    InputTextareaModule,
    TruncateTextPipe,
    TranslationModule,
    DatePipe
  ]
})
export class MyMeetingsComponent extends BaseComponent implements OnInit {
[x: string]: any;
  meetings = signal<Meeting[]>([]); 
  loading = signal<boolean>(false);
  currentPage=signal<number>(1);
  totalPages = signal<number>(1);
  totalItems = signal<number>(0);
  perPage = signal<number>(10);
  
  // Filter tabs
  selectedTab = signal<TabType>('upcoming');

  
  // Dialog properties
  selectedMeeting = signal<Meeting | null> (null);
  approveNotes= signal<string>('');
  postponeNotes = signal<string>('');
  actionLoading = signal<boolean>(false);
  showApproveDialog = signal<boolean>(false);
  showPostponeDialog = signal<boolean>(false);
  
  // Math reference for template
  Math = Math;

  private meetingsService= inject(MeetingsService);
  private router=inject(Router);
  private destroyRef = inject(DestroyRef);



  ngOnInit(): void {
    this.loadMeetings();
    
    // Subscribe to loading state
    this.meetingsService.isLoading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(loading => this.loading.set(loading));
  }

  goToClientProfile(meeting: Meeting): void {
  if (meeting.client.uuid) {
    this.router.navigate(['/app/insighter-dashboard/client-profile', meeting.client.uuid]);
  } 
  }

  loadMeetings(page: number = 1): void {
    this.currentPage.set(page);
    const dateStatus = this.getDateStatusFilter();
    this.meetingsService.getMeetings(page, this.perPage(), dateStatus)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: MeetingResponse) => {
          this.meetings.set(response.data);
          this.currentPage.set(response.meta.current_page);
          this.totalPages.set(response.meta.last_page);
          this.totalItems.set(response.meta.total)
        },
        error: (error) => {
          console.error('Error loading meetings:', error);
          this.handleServerErrors(error);
        }
      });
  }

  onTabChange(tab: TabType): void {
     this.selectedTab.set(tab);
     this.loadMeetings(1);
  }

  getDateStatusFilter(): string | undefined {
    if (this.selectedTab() === 'upcoming') {
      return 'upcoming';
    } else if (this.selectedTab() === 'past') {
      return 'past';
    }
    return undefined;
  }

  getFilteredMeetings(): Meeting[] {
    let filteredMeetings: Meeting[] = [];
    
    //date based (upcoming,past) // backend filter
    if(this.selectedTab() === 'upcoming' || this.selectedTab() === 'past'){
      filteredMeetings = this.meetings();
    }else{
      // status-based tabs ( pending , approved , postponed)
      filteredMeetings = this.meetings().filter((meeting:Meeting)=>(meeting.status === this.selectedTab()))
    }
   //sort by date closest meeting first
   return filteredMeetings.sort((a,b)=>{
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return dateA-dateB
   })
   
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
    this.selectedMeeting.set(meeting);
    this.approveNotes.set('')
    this.showApproveDialog.set(true);
  }

  openPostponeModal(meeting: Meeting): void {
   
    this.selectedMeeting.set(meeting);
    this.postponeNotes.set('')
    this.showPostponeDialog.set(true);
  }

  closeApproveDialog(): void {
    this.showApproveDialog.set(false)
    this.selectedMeeting.set(null);
    this.approveNotes.set('')
  }

  closePostponeDialog(): void {
    this.showPostponeDialog.set(false);
    this.selectedMeeting.set(null);
    this.postponeNotes.set('')
  }

  approveMeeting(): void {
    const meeting = this.selectedMeeting();
    if (!meeting ) {
      return;
    }
    this.actionLoading.set(true);
    this.meetingsService.updateMeetingStatus(
      meeting.uuid,
      'approved',
      this.approveNotes().trim()
    ).pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: () => {
        this.actionLoading.set(false);
        // Update the meeting status in the local array;
        const updatedMeetings = [...this.meetings()];
        const meetingIndex = updatedMeetings.findIndex(m => m.uuid === meeting.uuid);
        if (meetingIndex !== -1) {
          updatedMeetings[meetingIndex] = {
            ...updatedMeetings[meetingIndex],
            status:'approved'
          }
          this.meetings.set(updatedMeetings);
        }
        
        // Close dialog
    this.showApproveDialog.set(false);
        
        // Reset form
        this.selectedMeeting.set(null);
        this.approveNotes.set('');
      },
      error: (error: any) => {
        this.actionLoading.set(false);
        this.handleServerErrors(error);
      }
    });
  }

  postponeMeeting(): void {
    const meeting = this.selectedMeeting();
    const notes = this.postponeNotes();

    if (!meeting || !notes.trim()) {
      return;
      //show warning toast message
    }

    this.actionLoading.set(true);
    this.meetingsService.updateMeetingStatus(
      meeting.uuid,
      'postponed',
      notes.trim()
    ).pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next: () => {
        this.actionLoading.set(false);
        // Update the meeting status in the local array
        const updatedMeetings = [...this.meetings()];
        const meetingIndex = updatedMeetings.findIndex(m => m.uuid === meeting.uuid);
        if (meetingIndex !== -1) {
          updatedMeetings[meetingIndex] = {
            ...updatedMeetings[meetingIndex],
            status:'postponed'
          };
          this.meetings.set(updatedMeetings);
        }
        
        // Close dialog
        this.showPostponeDialog.set(false);
        
        // Reset form
        this.selectedMeeting.set(null);
        this.postponeNotes.set('')
        // Show success message (you can add a toast notification here)
      },
      error: (error: any) => {
        this.actionLoading.set(false)
        this.handleServerErrors(error);
      }
    });
  }


  private handleServerErrors(error: any) {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          this.showError('', messages.join(", "));
        }
      }
    } else {
      this.showError('','An unexpected error occurred.');
    }
  }
}