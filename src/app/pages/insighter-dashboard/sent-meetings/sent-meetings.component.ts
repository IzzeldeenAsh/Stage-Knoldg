import { Component, OnInit, OnDestroy, inject, DestroyRef, signal, computed } from '@angular/core';
import { Subject, take, takeUntil } from 'rxjs';
import { SentMeetingsService, SentMeeting, SentMeetingResponse } from '../../../_fake/services/meetings/sent-meetings.service';
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
  selector: 'app-sent-meetings',
  templateUrl: './sent-meetings.component.html',
  styleUrls: ['./sent-meetings.component.scss'],
  standalone: true,
  imports: [
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
export class SentMeetingsComponent extends BaseComponent implements OnInit {
  [x: string]: any;
  meetings = signal<SentMeeting[]>([]);
  loading = signal<boolean>(false);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  totalItems = signal<number>(0);
  perPage = signal<number>(10);

  // Computed signal for page numbers
  pageNumbers = computed(() => {
    const pages: number[] = [];
    const totalPages = this.showArchivedMeetings() ? this.archivedTotalPages() : this.totalPages();
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  });

  // Computed signal for current page
  currentDisplayPage = computed(() => {
    return this.showArchivedMeetings() ? this.archivedCurrentPage() : this.currentPage();
  });

  // Computed signal for total pages
  currentTotalPages = computed(() => {
    return this.showArchivedMeetings() ? this.archivedTotalPages() : this.totalPages();
  });

  // Computed signal for total items
  currentTotalItems = computed(() => {
    return this.showArchivedMeetings() ? this.archivedTotalItems() : this.totalItems();
  });

  // Filter tabs
  selectedTab = signal<TabType>('upcoming');

  // Archived meetings state
  showArchivedMeetings = signal<boolean>(false);
  archivedMeetings = signal<SentMeeting[]>([]);
  archivedCurrentPage = signal<number>(1);
  archivedTotalPages = signal<number>(1);
  archivedTotalItems = signal<number>(0);

  // Dialog properties
  selectedMeeting = signal<SentMeeting | null>(null);
  actionLoading = signal<boolean>(false);

  // Math reference for template
  Math = Math;

  private sentMeetingsService = inject(SentMeetingsService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.loadMeetings();

    // Subscribe to loading state
    this.sentMeetingsService.isLoading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(loading => this.loading.set(loading));
  }

  goToInsighterProfile(meeting: SentMeeting): void {
    if (meeting.insighter.uuid) {
      this.router.navigate(['/app/insighter-dashboard/insighter-profile', meeting.insighter.uuid]);
    }
  }

  loadMeetings(page: number = 1): void {
    this.currentPage.set(page);
    const dateStatus = this.getDateStatusFilter();
    this.sentMeetingsService.getSentMeetings(page, this.perPage(), dateStatus)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: SentMeetingResponse) => {
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
    this.showArchivedMeetings.set(false);
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

  getFilteredMeetings(): SentMeeting[] {
    let filteredMeetings: Meeting[] = [];

    // If showing archived meetings, return archived meetings
    if (this.selectedTab() === 'past' && this.showArchivedMeetings()) {
      filteredMeetings = this.archivedMeetings();
    } else if (this.selectedTab() === 'upcoming' || this.selectedTab() === 'past') {
      // date based (upcoming,past) // backend filter
      filteredMeetings = this.meetings();
    } else {
      // status-based tabs ( pending , approved , postponed)
      filteredMeetings = this.meetings().filter((meeting: SentMeeting) => (meeting.status === this.selectedTab()))
    }
    //sort by date closest meeting first
    return filteredMeetings.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateA - dateB
    })
  }

  onPageChange(page: number): void {
    if (this.showArchivedMeetings()) {
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

  /**
   * Reload meetings after an action (archive). If the current page becomes empty and is not the first page, go to the previous page.
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
      this.showError('', 'An unexpected error occurred.');
    }
  }

  /**
   * Open the meeting URL in a new tab
   */
  joinMeeting(meetingUrl: string): void {
    if (meetingUrl && meetingUrl !== '?pwd=') {
      window.open(meetingUrl, '_blank');
    }
  }

  /**
   * Archive a meeting
   */
  archiveMeeting(meeting: SentMeeting): void {
    this.actionLoading.set(true);
    this.sentMeetingsService.archiveMeeting(meeting.uuid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.actionLoading.set(false);
          this.showSuccess('Success', 'Meeting archived successfully');
          this.reloadMeetingsAfterAction();
        },
        error: (error: any) => {
          this.actionLoading.set(false);
          this.handleServerErrors(error);
        }
      });
  }

  /**
   * Toggle between past meetings and archived meetings
   */
  toggleArchivedMeetings(): void {
    const newState = !this.showArchivedMeetings();
    this.showArchivedMeetings.set(newState);

    if (newState) {
      this.loadArchivedMeetings(1);
    } else {
      this.loadMeetings(1);
    }
  }

  /**
   * Load archived meetings
   */
  loadArchivedMeetings(page: number = 1): void {
    this.archivedCurrentPage.set(page);
    this.sentMeetingsService.getArchivedMeetings(page, this.perPage())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: SentMeetingResponse) => {
          this.archivedMeetings.set(response.data);
          this.archivedCurrentPage.set(response.meta.current_page);
          this.archivedTotalPages.set(response.meta.last_page);
          this.archivedTotalItems.set(response.meta.total);
        },
        error: (error) => {
          console.error('Error loading archived meetings:', error);
          this.handleServerErrors(error);
        }
      });
  }
}
