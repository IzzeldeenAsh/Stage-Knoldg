import { Component, HostBinding, Input, OnInit, Output, EventEmitter, OnDestroy, Injector } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Notification } from 'src/app/_fake/services/nofitications/notifications.service';
import { BaseComponent } from 'src/app/modules/base.component';
import { TranslationService } from 'src/app/modules/i18n';
import { Router } from '@angular/router';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';

// No longer need tab types since we consolidated to a single view

@Component({
  selector: 'app-notifications-inner',
  templateUrl: './notifications-inner.component.html',
  host: {
    class: 'menu menu-sub menu-sub-dropdown menu-column w-350px w-lg-375px',
    '[class.show]': 'true'
  },
  styles: [`
    :host {
      position: absolute;
      z-index: 105;
      background: white;
      border-radius: 0.475rem;
      box-shadow: 0 0 50px 0 rgb(82 63 105 / 15%);
    }

    @media (max-width: 767px) {
      :host {
        width: 300px !important;
        max-width: 90vw !important;
      }
    }
  `]
})
export class NotificationsInnerComponent extends BaseComponent implements OnInit {
  @Input() notifications: Notification[] = [];
  @Input() parent: string = '';
  @Output() notificationClicked = new EventEmitter<string>();
  @Output() clickOutside = new EventEmitter<void>();

  // Removed activeTabId since tabs are no longer used
  alerts: Array<AlertModel> = defaultAlerts;
  logs: Array<LogModel> = defaultLogs;
  
  get unreadNotificationsCount(): number {
    // Count all unread notifications (where read_at is null or undefined)
    return this.notifications.filter(n => !n.read_at).length;
  }
  
  constructor(
    injector: Injector,
    private translationService: TranslationService,
    private router: Router,
    private profileService: ProfileService,
    private http: HttpClient
  ) {
    super(injector);
  }

  ngOnInit(): void {
    // Add click outside listener
    document.addEventListener('click', this.onClickOutside.bind(this));
  }
  
  // Handle click outside of dropdown
  onClickOutside(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // Check if the click was outside the dropdown
    if (
      target && 
      !target.closest('.notification-dropdown') && 
      !target.closest('.notification-toggle')
    ) {
      this.clickOutside.emit();
    }
  }

  // Mark a single notification as read by its ID
  markAsRead(notificationId: string, callback?: () => void): void {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Language': this.translationService.getSelectedLanguage()
    });
    
    this.http.put(`https://api.insightabusiness.com/api/account/notification/read/${notificationId}`, {}, { headers })
      .subscribe(
        () => {
          // Update local state to mark this notification as read
          if (this.notifications) {
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification) {
              notification.read_at = new Date().toISOString();
              
              // Count unread notifications
              const unreadCount = this.notifications.filter(n => !n.read_at).length;
              
              // Emit notification count change
              this.notificationClicked.emit(notificationId);
              
              // Execute callback if provided
              if (callback) {
                callback();
              }
            }
          }
        },
        (error: any) => {
          console.error(`Error marking notification ${notificationId} as read:`, error);
          // Still execute callback even if there was an error
          if (callback) {
            callback();
          }
        }
      );
  }
  ngOnDestroy(): void {
    document.removeEventListener('click', this.onClickOutside.bind(this));
  }

  onNotificationClick(notification: Notification, event?: MouseEvent) {
    // If event exists, prevent default to ensure we can complete the mark-as-read operation
    if (event) {
      event.preventDefault();
    }
    
    // Always mark the notification as read first and ensure it completes
    this.markAsRead(notification.id, () => {
      // After marking as read is complete, handle navigation if needed
      this.handleNotificationNavigation(notification);
    });
  }
  
  // Separate navigation logic to make it cleaner
  private handleNotificationNavigation(notification: Notification): void {
    // First, check for knowledge accept/decline notifications that need special handling
    if (notification.type === 'knowledge' && (notification.sub_type === 'accept_knowledge' || notification.sub_type === 'declined')) {
      // Check if user has company-insighter role
      this.profileService.getProfile().pipe().subscribe(user => {
        if (user && user.roles && user.roles.includes('company-insighter')) {
          // Route to my-knowledge-base view with param value
          this.router.navigate(['/app/my-knowledge-base/view-my-knowledge/', notification.param, 'details']);
        }
      });
      return;
    }
    
    // Handle knowledge notifications with category
    if (notification.type === 'knowledge' && notification.category) {
      // Construct the URL for knowledge page with sub_page and param
      const lang = this.translationService.getSelectedLanguage() || 'en';
      const knowledgeUrl = `https://insightabusiness.com/${lang}/knowledge/${notification.category}/${notification.param || ''}?tab=ask`;
      
      // Navigate to the external URL
      window.open(knowledgeUrl, '_blank');
      return;
    }
    
    // For meeting-related notifications, refresh profile first to ensure roles are current
    if(notification.type === 'meeting') {
      console.log('Meeting notification clicked:', notification);
      
      // Force refresh the profile before navigating
      this.profileService.refreshProfile().subscribe(user => {
        console.log('Profile refreshed, user roles:', user.roles);
        
        let targetRoute: string[] = [];
        
        if(notification.sub_type === 'insighter_meeting_reminder') {
          targetRoute = ['/app/insighter-dashboard/my-meetings/received'];
        } else if(notification.sub_type === 'insighter_meeting_client_new')
        {
          targetRoute = ['/app/insighter-dashboard/my-meetings/received'];
        }
        else if(notification.sub_type === 'insighter_meeting_client_approved'){
          targetRoute = ['/app/insighter-dashboard/my-meetings/received'];
        }
        else if (notification.sub_type.startsWith('client_')) {
          targetRoute = ['/app/insighter-dashboard/my-meetings/sent'];
        } 
        else if (notification.sub_type.startsWith('insighter_')) {
          targetRoute = ['/app/insighter-dashboard/my-meetings/received'];
        } 
        else if(notification.sub_type.startsWith('client_meeting_insighter_postponed')) {
          targetRoute = ['/app/insighter-dashboard/my-meetings/sent'];
        } 
        else if(notification.sub_type.startsWith('insighter_meeting_client_reschedule')) {
          targetRoute = ['/app/insighter-dashboard/my-meetings/received'];
        } 
        else if(notification.sub_type.startsWith('client_meeting_reschedule')) {
          targetRoute = ['/app/insighter-dashboard/my-meetings/sent'];
        } 
        else if(notification.sub_type.startsWith('insighter_meeting_reminder')) {
          targetRoute = ['/app/insighter-dashboard/my-meetings/received'];
        } 
        else if(notification.sub_type.startsWith('client_meeting_reminder')) {
          targetRoute = ['/app/insighter-dashboard/my-meetings/sent'];
        }
        
        // Check if we're already on this route before navigating
        if (targetRoute.length > 0) {
          const currentUrl = this.router.url;
          const targetUrl = targetRoute.join('/');
          
          // Only navigate if we're not already on the target page
          if (!currentUrl.includes(targetUrl)) {
            this.router.navigate(targetRoute);
          }
        }
      });
    }
  }
  
  // if(notification.type === 'meeting'){
  //   const baseUrl = window.location.origin;
  //   const lang = this.translationService.getSelectedLanguage() || 'en';
  //   // const tabParam = notification.param && notification.tap ? `?tab=${notification.tap}` : '';
  //   const knowledgeUrl = `https://insightabusiness.com/${lang}/knowledge/${notification.category}/${notification.param || ''}?`;
    
  //   // Navigate to the external URL
  //   window.open(knowledgeUrl, '_blank');
  // }

}

export interface AlertModel {
  title: string;
  description: string;
  time: string;
  icon: string;
  state: string;
}

export interface LogModel {
  code: string;
  state: string;
  message: string;
  time: string;
}

const defaultAlerts: Array<AlertModel> = [];
const defaultLogs: Array<LogModel> = [];
