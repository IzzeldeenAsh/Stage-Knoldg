import { Component, Injector, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponent } from 'src/app/modules/base.component';
import { NotificationsService, Notification } from 'src/app/_fake/services/nofitications/notifications.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-notifications-page',
  templateUrl: './admin-notifications-page.component.html',
  styleUrls: ['./admin-notifications-page.component.scss']
})
export class AdminNotificationsPageComponent extends BaseComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  loading = false;
  selectedFilter = 'all';
  searchValue = '';

  filterOptions = [
    { label: 'All Notifications', value: 'all' },
    { label: 'Unread', value: 'unread' },
    { label: 'Read', value: 'read' },
    { label: 'Requests', value: 'requests' },
    { label: 'Contact Us', value: 'contact-us' },
    { label: 'Knowledge', value: 'knowledge' },
    { label: 'Meetings', value: 'meeting' },
    { label: 'System', value: 'system' }
  ];

  private subscriptions: Subscription[] = [];

  constructor(
    injector: Injector,
    private notificationsService: NotificationsService,
    private router: Router
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadNotifications(): void {
    this.loading = true;
    
    const subscription = this.notificationsService.getNotifications(this.lang)
      .subscribe({
        next: (notifications) => {
          this.notifications = notifications;
          this.applyFilters();
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
          this.showError(
            this.lang === 'ar' ? 'خطأ' : 'Error',
            this.lang === 'ar' ? 'فشل في تحميل الإشعارات' : 'Failed to load notifications'
          );
          this.loading = false;
        }
      });
    
    this.subscriptions.push(subscription);
  }

  onFilterChange(event: any): void {
    this.selectedFilter = event.value;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.notifications];

    // Apply status filter
    if (this.selectedFilter === 'unread') {
      filtered = filtered.filter(n => !n.read_at);
    } else if (this.selectedFilter === 'read') {
      filtered = filtered.filter(n => !!n.read_at);
    } else if (this.selectedFilter !== 'all') {
      filtered = filtered.filter(n => n.type === this.selectedFilter);
    }

    // Apply search filter
    if (this.searchValue) {
      const searchLower = this.searchValue.toLowerCase();
      filtered = filtered.filter(n => 
        n.message.toLowerCase().includes(searchLower) ||
        n.type.toLowerCase().includes(searchLower) ||
        (n.sub_type && n.sub_type.toLowerCase().includes(searchLower))
      );
    }

    this.filteredNotifications = filtered.sort((a, b) => {
      // Sort unread first, then by newest
      if (!a.read_at && b.read_at) return -1;
      if (a.read_at && !b.read_at) return 1;
      return new Date(b.id).getTime() - new Date(a.id).getTime();
    });
  }

  onNotificationClick(notification: Notification, event?: MouseEvent): void {
    console.log('Notification clicked:', notification);
    if (event) {
      event.preventDefault();
    }

    // For already read notifications, navigate directly
    if (notification.read_at) {
      console.log('Already read, navigating directly');
      this.navigateToNotification(notification);
      return;
    }

    // Mark as read first, then navigate
    console.log('Marking as read and then navigating');
    this.markAsRead(notification, () => {
      console.log('Marked as read, now navigating');
      this.navigateToNotification(notification);
    });
  }

  private navigateToNotification(notification: Notification): void {
    console.log('Navigating notification:', notification);
    let targetRoute: string = '';

    // Simple navigation based on notification type
    if (notification.type === 'contact-us') {
      targetRoute = '/admin-dashboard/admin/contact-messages/contact-list';
    } else if (notification.type === 'requests') {
      targetRoute = '/admin-dashboard/admin/dashboard/main-dashboard/requests';
    }

    console.log('Target route:', targetRoute);
    
    if (targetRoute) {
      this.router.navigate([targetRoute]).then(
        (success) => console.log('Navigation success:', success),
        (error) => console.log('Navigation error:', error)
      );
    }
  }

  markAsRead(notification: Notification, callback?: () => void): void {
    if (notification.read_at) return; // Already read

    const subscription = this.notificationsService.markAsRead(notification.id, this.lang)
      .subscribe({
        next: () => {
          notification.read_at = new Date().toISOString();
          this.showSuccess(
            this.lang === 'ar' ? 'تم' : 'Success',
            this.lang === 'ar' ? 'تم وضع علامة كمقروء' : 'Marked as read'
          );
          this.applyFilters();
          
          // Execute callback if provided
          if (callback) {
            callback();
          }
        },
        error: (error) => {
          console.error('Error marking notification as read:', error);
          this.showError(
            this.lang === 'ar' ? 'خطأ' : 'Error',
            this.lang === 'ar' ? 'فشل في وضع علامة كمقروء' : 'Failed to mark as read'
          );
        }
      });
    
    this.subscriptions.push(subscription);
  }

  markAllAsRead(): void {
    const unreadNotifications = this.notifications.filter(n => !n.read_at);
    
    if (unreadNotifications.length === 0) {
      this.showInfo(
        this.lang === 'ar' ? 'معلومات' : 'Info',
        this.lang === 'ar' ? 'لا توجد إشعارات غير مقروءة' : 'No unread notifications'
      );
      return;
    }

    // Mark all unread notifications as read
    unreadNotifications.forEach(notification => {
      this.markAsRead(notification);
    });
  }


  formatTimeAgo(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) {
      return this.lang === 'ar' ? 'الآن' : 'Now';
    } else if (diffMinutes < 60) {
      return this.lang === 'ar' ? `قبل ${diffMinutes} دقيقة` : `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return this.lang === 'ar' ? `قبل ${diffHours} ساعة` : `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return this.lang === 'ar' ? `قبل ${diffDays} يوم` : `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString(this.lang === 'ar' ? 'ar' : 'en');
    }
  }

  get unreadCount(): number {
    return this.notifications.filter(n => !n.read_at).length;
  }

  get totalCount(): number {
    return this.notifications.length;
  }
}