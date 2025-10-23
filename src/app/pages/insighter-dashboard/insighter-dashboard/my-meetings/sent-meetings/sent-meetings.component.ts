import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { SentMeetingsService, SentMeeting, SentMeetingResponse, AvailableHoursResponse, AvailableDay, AvailableTime, RescheduleRequest, MeetingStatistics } from '../../../../../_fake/services/meetings/sent-meetings.service';

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
  selectedTab: 'pending' | 'approved' | 'postponed' | 'upcoming' | 'past' | 'coming'= 'coming';

  // Archived meetings state
  showArchivedMeetings = false;
  archivedMeetings: SentMeeting[] = [];
  archivedCurrentPage = 1;
  archivedTotalPages = 1;
  archivedTotalItems = 0;
  archivedCount = 0;

  // Action loading state
  actionLoading = false;
  
  // Reschedule modal
  showRescheduleModal = false;
  selectedMeetingForReschedule: SentMeeting | null = null;
  availableDays: AvailableDay[] = [];
  selectedDate: string = '';
  selectedCalendarDate: Date | null = null;
  selectedTimeSlot: AvailableTime | null = null;
  rescheduleLoading = false;
  minDate: Date = new Date();
  maxDate: Date = new Date(new Date().setMonth(new Date().getMonth() + 3)); // Allow 3 months ahead
  
  // Custom calendar properties
  currentMonth = new Date();
  currentYear = new Date().getFullYear();
  currentMonthName = '';
  monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Math reference for template
  Math = Math;
  
  private destroy$ = new Subject<void>();

  constructor(
    private sentMeetingsService: SentMeetingsService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadMeetings();
    this.loadMeetingStatistics();
    this.updateCurrentMonthName();

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
  if (this.selectedTab === 'coming') {
      this.loading = true;

      const upcoming$ = this.sentMeetingsService.getSentMeetings(page, this.perPage, 'upcoming');
      const approved$ = this.sentMeetingsService.getSentMeetings(page, this.perPage, undefined); 

      // Combine both results
      forkJoin([upcoming$, approved$])
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: ([upcomingRes, approvedRes]) => {
            console.log("UPCOMINGR RES --->",upcomingRes)
            console.log("approvedRes RES --->",approvedRes)
            const approvedMeetings = approvedRes.data.filter(m => m.status === 'approved');
            this.meetings = [...upcomingRes.data, ...approvedMeetings];

            this.totalPages = upcomingRes.meta.last_page;
            this.totalItems = upcomingRes.meta.total + approvedMeetings.length;
            this.currentPage = upcomingRes.meta.current_page;
            this.loading = false;
          },
          error: (error) => {
            console.error('Error loading coming meetings:', error);
            this.loading = false;
          }
        });

    } else {
      const dateStatus = this.getDateStatusFilter();
      this.sentMeetingsService.getSentMeetings(page, this.perPage, dateStatus)
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
  }
  onTabChange(tab: 'pending' | 'approved' | 'postponed' | 'upcoming' | 'past' | 'coming'): void {
    this.selectedTab = tab;
    this.showArchivedMeetings = false;
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

  getFilteredMeetings(): SentMeeting[] {
    let filteredMeetings: SentMeeting[] = [];

    // If showing archived meetings, return archived meetings
    if (this.selectedTab === 'past' && this.showArchivedMeetings) {
      filteredMeetings = this.archivedMeetings;
    } else if (this.selectedTab === 'upcoming' || this.selectedTab === 'past' || this.selectedTab === 'coming') {
      // For date-based tabs (upcoming/past), the filtering is done on the backend
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
    if (this.showArchivedMeetings) {
      this.loadArchivedMeetings(page);
    } else {
      this.loadMeetings(page);
    }
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

  isClosestMeeting(meeting: SentMeeting, index: number): boolean {
    const filteredMeetings = this.getFilteredMeetings();
    // Only the first meeting (closest) gets the orange color
    return index === 0 && filteredMeetings.length > 0;
  }

  // Navigate to insighter profile
  goToInsighterProfile(insighterUuid: string): void {
    const currentLocale = localStorage.getItem('language') || 'en';
   window.location.href = `https://knoldg.com/${currentLocale}/profile/${insighterUuid}?entity=insighter&tab=meet`;
  }

  // Join meeting
  joinMeeting(meetingUrl: string): void {
    if (meetingUrl) {
      window.open(meetingUrl, '_blank');
    }
  }

  // Check if meeting can be joined (only upcoming meetings that are not pending, past, or postponed)
  canJoinMeeting(meeting: SentMeeting): boolean {
    return this.selectedTab !== 'past' && meeting.status === 'approved';
  }

  // Check if meeting can be rescheduled (only postponed meetings)
  canRescheduleMeeting(meeting: SentMeeting): boolean {
    return meeting.status === 'postponed';
  }

  // Open reschedule modal
  openRescheduleModal(meeting: SentMeeting): void {
    this.selectedMeetingForReschedule = meeting;
    this.showRescheduleModal = true;
    this.loadAvailableHours(meeting.insighter.uuid);
  }

  // Close reschedule modal
  closeRescheduleModal(): void {
    this.showRescheduleModal = false;
    this.selectedMeetingForReschedule = null;
    this.availableDays = [];
    this.selectedDate = '';
    this.selectedCalendarDate = null;
    this.selectedTimeSlot = null;
  }

  // Load available hours
  loadAvailableHours(insighterUuid: string): void {
    this.rescheduleLoading = true;
    this.sentMeetingsService.getAvailableHours(insighterUuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: AvailableHoursResponse) => {
          this.availableDays = response.data;
          this.rescheduleLoading = false;
        },
        error: (error) => {
          console.error('Error loading available hours:', error);
          this.rescheduleLoading = false;
        }
      });
  }

  // Select date
  selectDate(date: string): void {
    this.selectedDate = date;
    this.selectedTimeSlot = null;
  }

  // Handle calendar date selection
  onCalendarDateSelect(date: Date): void {
    if (date) {
      const selectedDateString = this.formatDateToString(date);
      // Check if this date has available times
      if (this.isDateActive(selectedDateString)) {
        this.selectedCalendarDate = date;
        this.selectedDate = selectedDateString;
        this.selectedTimeSlot = null;
      }
    }
  }

  // Format date to YYYY-MM-DD string
  formatDateToString(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Check if a date should be disabled in the calendar
  isCalendarDateDisabled(date: Date): boolean {
    const dateString = this.formatDateToString(date);
    return !this.isDateActive(dateString);
  }

  // Helper method to create date from template date object
  getDateFromTemplateDate(templateDate: any): Date {
    return new Date(templateDate.year, templateDate.month, templateDate.day);
  }

  // Check if template date is active
  isTemplateDateActive(templateDate: any): boolean {
    const date = this.getDateFromTemplateDate(templateDate);
    const dateString = this.formatDateToString(date);
    return this.isDateActive(dateString);
  }

  // Select time slot
  selectTimeSlot(timeSlot: AvailableTime): void {
    this.selectedTimeSlot = timeSlot;
  }

  // Check if the selected time is different from current meeting time
  isDifferentTime(): boolean {
    if (!this.selectedMeetingForReschedule || !this.selectedTimeSlot || !this.selectedDate) {
      return false;
    }
    
    const currentDate = this.selectedMeetingForReschedule.date;
    const currentStartTime = this.selectedMeetingForReschedule.start_time;
    const currentEndTime = this.selectedMeetingForReschedule.end_time;
    
    return !(this.selectedDate === currentDate && 
             this.selectedTimeSlot.start_time === currentStartTime && 
             this.selectedTimeSlot.end_time === currentEndTime);
  }

  // Get available times for selected date
  getAvailableTimesForDate(date: string): AvailableTime[] {
    const day = this.availableDays.find(d => d.date === date);
    return day ? day.times : [];
  }

  // Check if date is active (has available times)
  isDateActive(date: string): boolean {
    const day = this.availableDays.find(d => d.date === date);
    return day ? day.active : false;
  }

  // Format date for display
  formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }

  // Format time for display (24-hour format)
  formatTimeForDisplay(time: string): string {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  }

  // Confirm reschedule
  confirmReschedule(): void {
    if (!this.selectedMeetingForReschedule || !this.selectedTimeSlot || !this.selectedDate || !this.isDifferentTime()) {
      return;
    }

    const rescheduleData: RescheduleRequest = {
      meeting_date: this.selectedDate,
      start_time: this.selectedTimeSlot.start_time.substring(0, 5), // Remove seconds
      end_time: this.selectedTimeSlot.end_time.substring(0, 5) // Remove seconds
    };

    this.rescheduleLoading = true;
    this.sentMeetingsService.rescheduleMeeting(this.selectedMeetingForReschedule.uuid, rescheduleData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Meeting rescheduled successfully:', response);
          this.closeRescheduleModal();
          this.loadMeetings(this.currentPage); // Reload meetings
          this.rescheduleLoading = false;
        },
        error: (error) => {
          console.error('Error rescheduling meeting:', error);
          this.rescheduleLoading = false;
        }
      });
  }

  // Custom Calendar Methods
  updateCurrentMonthName(): void {
    this.currentMonthName = this.monthNames[this.currentMonth.getMonth()];
    this.currentYear = this.currentMonth.getFullYear();
  }

  previousMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    this.updateCurrentMonthName();
  }

  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 1);
    this.updateCurrentMonthName();
  }

  getEmptyDays(): number[] {
    const firstDay = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth(), 1).getDay();
    return Array(firstDay).fill(0);
  }

  getDaysInCurrentMonth(): number[] {
    const daysInMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1, 0).getDate();
    return Array.from({length: daysInMonth}, (_, i) => i + 1);
  }

  getDateString(day: number): string {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const date = new Date(year, month, day);
    return this.formatDateToString(date);
  }

  getFormattedSelectedDate(): string {
    if (!this.selectedDate) return '';
    const date = new Date(this.selectedDate);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[date.getDay()];
    const monthName = this.monthNames[date.getMonth()];
    const dayNumber = date.getDate();
    return `${dayName}, ${monthName} ${dayNumber}`;
  }

  /**
   * Archive a meeting
   */
  archiveMeeting(meeting: SentMeeting): void {
    this.actionLoading = true;
    this.sentMeetingsService.archiveMeeting(meeting.uuid)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.actionLoading = false;
          console.log('Meeting archived successfully');
          this.reloadMeetingsAfterAction();
        },
        error: (error: any) => {
          this.actionLoading = false;
          console.error('Error archiving meeting:', error);
        }
      });
  }

  /**
   * Toggle between past meetings and archived meetings
   */
  toggleArchivedMeetings(): void {
    this.showArchivedMeetings = !this.showArchivedMeetings;

    if (this.showArchivedMeetings) {
      this.loadArchivedMeetings(1);
    } else {
      this.loadMeetings(1);
    }
  }

  /**
   * Load archived meetings
   */
  loadArchivedMeetings(page: number = 1): void {
    this.archivedCurrentPage = page;
    this.sentMeetingsService.getArchivedMeetings(page, this.perPage)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: SentMeetingResponse) => {
          this.archivedMeetings = response.data;
          this.archivedCurrentPage = response.meta.current_page;
          this.archivedTotalPages = response.meta.last_page;
          this.archivedTotalItems = response.meta.total;
        },
        error: (error) => {
          console.error('Error loading archived meetings:', error);
        }
      });
  }

  /**
   * Reload meetings after an action (archive). If the current page becomes empty and is not the first page, go to the previous page.
   */
  private reloadMeetingsAfterAction(): void {
    // Reload meetings for the current page
    this.loadMeetings(this.currentPage);
    // Reload statistics to update archived count
    this.loadMeetingStatistics();
    // After loading, check if the current page is empty and not the first page
    setTimeout(() => {
      if (this.getFilteredMeetings().length === 0 && this.currentPage > 1) {
        this.loadMeetings(this.currentPage - 1);
      }
    }, 500); // Wait for meetings to reload
  }

  /**
   * Get current page based on archive state
   */
  getCurrentPage(): number {
    return this.showArchivedMeetings ? this.archivedCurrentPage : this.currentPage;
  }

  /**
   * Get current total pages based on archive state
   */
  getCurrentTotalPages(): number {
    return this.showArchivedMeetings ? this.archivedTotalPages : this.totalPages;
  }

  /**
   * Get current total items based on archive state
   */
  getCurrentTotalItems(): number {
    return this.showArchivedMeetings ? this.archivedTotalItems : this.totalItems;
  }

  /**
   * Load meeting statistics to get archived count
   */
  loadMeetingStatistics(): void {
    this.sentMeetingsService.getMeetingStatistics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.archivedCount = response.data.archived;
        },
        error: (error) => {
          console.error('Error loading meeting statistics:', error);
        }
      });
  }
} 