import { Component, HostBinding, Input, OnInit, Output, EventEmitter, OnDestroy, Injector } from '@angular/core';
import { Notification } from 'src/app/_fake/services/nofitications/notifications.service';
import { BaseComponent } from 'src/app/modules/base.component';

export type NotificationsTabsType =
  | 'kt_topbar_notifications_1'
  | 'kt_topbar_notifications_2'
  | 'kt_topbar_notifications_3';

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
      top: 100%;
      margin-top: 0.5rem;
      background: white;
      border-radius: 0.475rem;
      box-shadow: 0 0 50px 0 rgb(82 63 105 / 15%);
    }

    :host-context([dir="ltr"]) {
      left: 0;
      transform: translateX(-30%);
    }

    :host-context([dir="rtl"]) {
      right: 0;
      transform: translateX(30%);
    }

    @media (max-width: 767px) {
      :host {
        width: 300px !important;
        max-width: 90vw !important;
      }
      
      :host-context([dir="ltr"]) {
        left: 0;
        transform: none;
      }
      
      :host-context([dir="rtl"]) {
        right: 0;
        transform: none;
      }
    }
  `]
})
export class NotificationsInnerComponent extends BaseComponent implements OnInit {
  @Input() notifications: Notification[] = [];
  @Input() parent: string = '';
  @Output() notificationClicked = new EventEmitter<string>();
  @Output() clickOutside = new EventEmitter<void>();

  activeTabId: NotificationsTabsType = 'kt_topbar_notifications_1';
  alerts: Array<AlertModel> = defaultAlerts;
  logs: Array<LogModel> = defaultLogs;

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit(): void {
    // Add click outside listener
    document.addEventListener('click', this.onClickOutside.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('click', this.onClickOutside.bind(this));
  }

  private onClickOutside(event: MouseEvent) {
    if (!(event.target as HTMLElement).closest('.app-navbar-item')) {
      this.clickOutside.emit();
    }
  }

  setActiveTabId(tabId: NotificationsTabsType) {
    this.activeTabId = tabId;
  }

  onNotificationClick(notificationId: string) {
    this.notificationClicked.emit(notificationId);
  }
}

interface AlertModel {
  title: string;
  description: string;
  time: string;
  icon: string;
  state: 'primary' | 'danger' | 'warning' | 'success' | 'info';
}

const defaultAlerts: Array<AlertModel> = [
  {
    title: 'Project Alice',
    description: 'Phase 1 development',
    time: '1 hr',
    icon: 'icons/duotune/technology/teh008.svg',
    state: 'primary',
  },
  {
    title: 'HR Confidential',
    description: 'Confidential staff documents',
    time: '2 hrs',
    icon: 'icons/duotune/general/gen044.svg',
    state: 'danger',
  },
  {
    title: 'Company HR',
    description: 'Corporeate staff profiles',
    time: '5 hrs',
    icon: 'icons/duotune/finance/fin006.svg',
    state: 'warning',
  },
  {
    title: 'Project Redux',
    description: 'New frontend admin theme',
    time: '2 days',
    icon: 'icons/duotune/files/fil023.svg',
    state: 'success',
  },
  {
    title: 'Project Breafing',
    description: 'Product launch status update',
    time: '21 Jan',
    icon: 'icons/duotune/maps/map001.svg',
    state: 'primary',
  },
  {
    title: 'Banner Assets',
    description: 'Collection of banner images',
    time: '21 Jan',
    icon: 'icons/duotune/general/gen006.svg',
    state: 'info',
  },
  {
    title: 'Icon Assets',
    description: 'Collection of SVG icons',
    time: '20 March',
    icon: 'icons/duotune/art/art002.svg',
    state: 'warning',
  },
];

interface LogModel {
  code: string;
  state: 'success' | 'danger' | 'warning';
  message: string;
  time: string;
}

const defaultLogs: Array<LogModel> = [
  { code: '200 OK', state: 'success', message: 'New order', time: 'Just now' },
  { code: '500 ERR', state: 'danger', message: 'New customer', time: '2 hrs' },
  {
    code: '200 OK',
    state: 'success',
    message: 'Payment process',
    time: '5 hrs',
  },
  {
    code: '300 WRN',
    state: 'warning',
    message: 'Search query',
    time: '2 days',
  },
  {
    code: '200 OK',
    state: 'success',
    message: 'API connection',
    time: '1 week',
  },
  {
    code: '200 OK',
    state: 'success',
    message: 'Database restore',
    time: 'Mar 5',
  },
  {
    code: '300 WRN',
    state: 'warning',
    message: 'System update',
    time: 'May 15',
  },
  {
    code: '300 WRN',
    state: 'warning',
    message: 'Server OS update',
    time: 'Apr 3',
  },
  {
    code: '300 WRN',
    state: 'warning',
    message: 'API rollback',
    time: 'Jun 30',
  },
  {
    code: '500 ERR',
    state: 'danger',
    message: 'Refund process',
    time: 'Jul 10',
  },
  {
    code: '500 ERR',
    state: 'danger',
    message: 'Withdrawal process',
    time: 'Sep 10',
  },
  { code: '500 ERR', state: 'danger', message: 'Mail tasks', time: 'Dec 10' },
];
