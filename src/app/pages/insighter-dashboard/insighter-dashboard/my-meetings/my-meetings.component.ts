import { Component, OnInit, OnDestroy, inject, DestroyRef, signal, computed } from '@angular/core';
import { Subject, take, takeUntil } from 'rxjs';
import { MeetingsService, Meeting, MeetingResponse, AvailableHoursResponse, AvailableDay, AvailableTime, RescheduleRequest } from '../../../../_fake/services/meetings/meetings.service';
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
  
  // Computed signal for page numbers
  pageNumbers = computed(() => {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages(); i++) {
      pages.push(i);
    }
    return pages;
  });
  
  // Filter tabs
  selectedTab = signal<TabType>('upcoming');

  
  // Dialog properties
  selectedMeeting = signal<Meeting | null> (null);
  approveNotes= signal<string>('');
  postponeNotes = signal<string>('');
  actionLoading = signal<boolean>(false);
  showApproveDialog = signal<boolean>(false);
  showPostponeDialog = signal<boolean>(false);

  // Reschedule modal properties
  showRescheduleDialog = signal<boolean>(false);
  selectedMeetingForReschedule = signal<Meeting | null>(null);
  rescheduleLoading = signal<boolean>(false);
  availableDays = signal<AvailableDay[]>([]);
  selectedDate = signal<string>('');
  selectedCalendarDate = signal<Date | null>(null);
  selectedTimeSlot = signal<AvailableTime | null>(null);
  
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
    // Use 24-hour format
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
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
        // Always reload meetings from backend after status change
        this.showApproveDialog.set(false);
        this.selectedMeeting.set(null);
        this.approveNotes.set('');
        this.reloadMeetingsAfterAction();
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
        this.showPostponeDialog.set(false);
        this.selectedMeeting.set(null);
        this.postponeNotes.set('');
        this.reloadMeetingsAfterAction();
      },
      error: (error: any) => {
        this.actionLoading.set(false)
        this.handleServerErrors(error);
      }
    });
  }

  /**
   * Reload meetings after an action (approve/postpone). If the current page becomes empty and is not the first page, go to the previous page.
   */
  private reloadMeetingsAfterAction(): void {
    // Reload meetings for the current page
    this.loadMeetings(this.currentPage());
    // After loading, check if the current page is empty and not the first page
    setTimeout(() => {
      if (this.getFilteredMeetings().length === 0 && this.currentPage() > 1) {
        this.loadMeetings(this.currentPage() - 1);
      }
    }, 500); // Wait for meetings to reload
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

  // Reschedule functionality
  canRescheduleMeeting(meeting: Meeting): boolean {
    return meeting.status === 'postponed';
  }

  openRescheduleModal(meeting: Meeting): void {
    this.selectedMeetingForReschedule.set(meeting);
    this.showRescheduleDialog.set(true);
    this.loadAvailableHours();
  }

  closeRescheduleDialog(): void {
    this.showRescheduleDialog.set(false);
    this.selectedMeetingForReschedule.set(null);
    this.availableDays.set([]);
    this.selectedDate.set('');
    this.selectedCalendarDate.set(null);
    this.selectedTimeSlot.set(null);
  }

  loadAvailableHours(): void {
    this.rescheduleLoading.set(true);
    this.meetingsService.getAvailableHours()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: AvailableHoursResponse) => {
          this.availableDays.set(response.data);
          this.rescheduleLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading available hours:', error);
          this.rescheduleLoading.set(false);
          this.handleServerErrors(error);
        }
      });
  }

  selectDate(date: string): void {
    this.selectedDate.set(date);
    this.selectedTimeSlot.set(null);

    // Convert string date to Date object for calendar
    const dateObj = new Date(date);
    this.selectedCalendarDate.set(dateObj);
  }

  selectTimeSlot(timeSlot: AvailableTime): void {
    this.selectedTimeSlot.set(timeSlot);
  }

  isDifferentTime(): boolean {
    const meeting = this.selectedMeetingForReschedule();
    const timeSlot = this.selectedTimeSlot();
    const date = this.selectedDate();

    if (!meeting || !timeSlot || !date) {
      return false;
    }

    const currentDate = meeting.date;
    const currentStartTime = meeting.start_time;
    const currentEndTime = meeting.end_time;

    return !(date === currentDate &&
             timeSlot.start_time === currentStartTime &&
             timeSlot.end_time === currentEndTime);
  }

  getAvailableTimesForDate(date: string): AvailableTime[] {
    const day = this.availableDays().find(d => d.date === date);
    return day ? day.times : [];
  }

  isDateActive(date: string): boolean {
    const day = this.availableDays().find(d => d.date === date);
    return day ? day.active : false;
  }

  formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatTimeForDisplay(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour24 = parseInt(hours);
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  }

  confirmReschedule(): void {
    const meeting = this.selectedMeetingForReschedule();
    const timeSlot = this.selectedTimeSlot();
    const date = this.selectedDate();

    if (!meeting || !timeSlot || !date || !this.isDifferentTime()) {
      return;
    }

    const rescheduleData: RescheduleRequest = {
      meeting_date: date,
      start_time: timeSlot.start_time.substring(0, 5), // Remove seconds
      end_time: timeSlot.end_time.substring(0, 5) // Remove seconds
    };

    this.rescheduleLoading.set(true);
    this.meetingsService.rescheduleMeeting(meeting.uuid, rescheduleData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showSuccess('', this.lang === 'ar' ? 'تم إعادة جدولة الاجتماع بنجاح' : 'Meeting rescheduled successfully');
          this.closeRescheduleDialog();
          this.reloadMeetingsAfterAction();
          this.rescheduleLoading.set(false);
        },
        error: (error) => {
          console.error('Error rescheduling meeting:', error);
          this.rescheduleLoading.set(false);
          this.handleServerErrors(error);
        }
      });
  }

  /**
   * Open the meeting URL in a new tab
   */
  joinMeeting(meetingUrl: string): void {
    if (meetingUrl && meetingUrl !== '?pwd=') {
      window.open(meetingUrl, '_blank');
    }
  }
}