import { Component, HostBinding, Input, OnInit, Output, EventEmitter, OnDestroy, Injector } from '@angular/core';
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
    private profileService: ProfileService
  ) {
    super(injector);
  }

  ngOnInit(): void {
    // Add click outside listener
    document.addEventListener('click', this.onClickOutside.bind(this));
    
    // Mark all notifications as read when the component is initialized
    this.markAllNotificationsAsRead();
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

  // Mark all notifications as read
  markAllNotificationsAsRead(): void {
    // Logic to mark all notifications as read would go here
    // This can be implemented as needed
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.onClickOutside.bind(this));
  }

  onNotificationClick(notification: Notification) {
    // First, check for knowledge accept/decline notifications that need special handling
    if (notification.type === 'knowledge' && (notification.sub_type === 'accept_knowledge' || notification.sub_type === 'declined')) {
      // Check if user has company-insighter role
      this.profileService.getProfile().pipe().subscribe(user => {
        if (user && user.roles && user.roles.includes('company-insighter')) {
          // Route to my-knowledge-base view with param value
          this.router.navigate(['/app/my-knowledge-base/view-my-knowledge/', notification.param, 'details']);
        } else {
          // For other users, use the default notification links
          this.notificationClicked.emit(notification.id);
        }
      });
      return;
    }
    
    // Handle knowledge notifications with category
    if (notification.type === 'knowledge' && notification.category) {
      // Construct the URL for knowledge page with sub_page and param
      const baseUrl = window.location.origin;
      const lang = this.translationService.getSelectedLanguage() || 'en';
      const tabParam = notification.param && notification.tap ? `?tab=${notification.tap}` : '';
      const knowledgeUrl = `https://knoldg.com/${lang}/knowledge/${notification.category}/${notification.param || ''}${tabParam}`;
      
      // Navigate to the external URL
      window.open(knowledgeUrl, '_blank');
    } else {
      // For other notifications, just emit the ID as before
      this.notificationClicked.emit(notification.id);
    }
  }
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
