import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NavigationCancel, NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LayoutService } from '../../core/layout.service';
import { MenuComponent } from '../../../kt/components';
import { ILayout, LayoutType } from '../../core/configs/config';
import { MenuItem } from 'primeng/api';
import { OverlayPanel } from 'primeng/overlaypanel';
import { IForsightaProfile } from 'src/app/_fake/models/profile.interface';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { NotificationsService } from 'src/app/_fake/services/notifications/notifications.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  private unsubscribe: Subscription[] = [];
  // Public props
  currentLayoutType: LayoutType | null;

  appHeaderDisplay: boolean;
  appHeaderDefaultFixedDesktop: boolean;
  appHeaderDefaultFixedMobile: boolean;

  appHeaderDefaultContainer: 'fixed' | 'fluid';
  headerContainerCssClass: string = '';
  appHeaderDefaultContainerClass: string = '';

  appHeaderDefaultStacked: boolean;

  // view
  appSidebarDefaultCollapseDesktopEnabled: boolean;
  appSidebarDisplay: boolean;
  appHeaderDefaultContent: string = '';
  appHeaderDefaulMenuDisplay: boolean;
  appPageTitleDisplay: boolean;

  menuItems: MenuItem[] = [];
  notificationCount: number = 0;
  notifications: any[] = [];
  userProfile: IForsightaProfile;
  userPhotoUrl: string = '';
  userInitials: string = '';

  @ViewChild('notificationsOverlay') notificationsOverlay: OverlayPanel;
  @ViewChild('userMenuOverlay') userMenuOverlay: OverlayPanel;

  constructor(
    private layout: LayoutService,
    private router: Router,
    private profileService: ProfileService,
    private notificationsService: NotificationsService,
    private sanitizer: DomSanitizer
  ) {
    this.routingChanges();
    this.initializeMenu();
  }

  private initializeMenu() {
    this.menuItems = [
     
      {
        label: 'Industries',
        icon: '',
        items: [
          {
          label: 'All Industries',
            routerLink: ['/all-industries']
          },
          {
            label: 'Add Knowledge',
            routerLink: ['/add-knowledge']
          }
        ]
      }
    ];
  }

  updateProps(config: ILayout) {
    this.appHeaderDisplay = this.layout.getProp(
      'app.header.display',
      config
    ) as boolean;
    // view
    this.appSidebarDefaultCollapseDesktopEnabled = this.layout.getProp(
      'app.sidebar.default.collapse.desktop.enabled',
      config
    ) as boolean;
    this.appSidebarDisplay = this.layout.getProp(
      'app.sidebar.display',
      config
    ) as boolean;
    this.appHeaderDefaultContent = this.layout.getProp(
      'app.header.default.content',
      config
    ) as string;
    this.appHeaderDefaulMenuDisplay = this.layout.getProp(
      'app.header.default.menu.display',
      config
    ) as boolean;
    this.appPageTitleDisplay = this.layout.getProp(
      'app.pageTitle.display',
      config
    ) as boolean;

    // body attrs and container css classes
    this.appHeaderDefaultFixedDesktop = this.layout.getProp(
      'app.header.default.fixed.desktop',
      config
    ) as boolean;
    if (this.appHeaderDefaultFixedDesktop) {
      document.body.setAttribute('data-kt-app-header-fixed', 'true');
    }

    this.appHeaderDefaultFixedMobile = this.layout.getProp(
      'app.header.default.fixed.mobile',
      config
    ) as boolean;
    if (this.appHeaderDefaultFixedMobile) {
      document.body.setAttribute('data-kt-app-header-fixed-mobile', 'true');
    }

    this.appHeaderDefaultContainer = this.layout.getProp(
      'appHeaderDefaultContainer',
      config
    ) as 'fixed' | 'fluid';
    this.headerContainerCssClass =
      this.appHeaderDefaultContainer === 'fixed'
        ? 'container-xxl'
        : 'container-fluid';

    this.appHeaderDefaultContainerClass = this.layout.getProp(
      'app.header.default.containerClass',
      config
    ) as string;
    if (this.appHeaderDefaultContainerClass) {
      this.headerContainerCssClass += ` ${this.appHeaderDefaultContainerClass}`;
    }

    this.appHeaderDefaultStacked = this.layout.getProp(
      'app.header.default.stacked',
      config
    ) as boolean;
    if (this.appHeaderDefaultStacked) {
      document.body.setAttribute('data-kt-app-header-stacked', 'true');
    }

    // Primary header
    // Secondary header
  }

  ngOnInit(): void {
    const subscr = this.layout.layoutConfigSubject
      .asObservable()
      .subscribe((config: ILayout) => {
        this.updateProps(config);
      });
    this.unsubscribe.push(subscr);
    const layoutSubscr = this.layout.currentLayoutTypeSubject
      .asObservable()
      .subscribe((layout) => {
        this.currentLayoutType = layout;
      });
    this.unsubscribe.push(layoutSubscr);

    // Subscribe to profile changes
    this.profileService.getProfile().subscribe(profile => {
      this.userProfile = profile;
      if (profile) {
        this.userPhotoUrl = profile.profile_photo_url || '';
        this.userInitials = `${profile.first_name?.charAt(0) || ''}${profile.last_name?.charAt(0) || ''}`;
      }
    });

    // Subscribe to notifications
    this.notificationsService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
      this.notificationCount = notifications.length;
    });

    // Start polling for notifications
    this.notificationsService.startPolling();
  }

  routingChanges() {
    const routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd || event instanceof NavigationCancel) {
        MenuComponent.reinitialization();
      }
    });
    this.unsubscribe.push(routerSubscription);
  }

  toggleNotifications(event: Event) {
    this.notificationsOverlay.toggle(event);
    if (this.userMenuOverlay?.overlayVisible) {
      this.userMenuOverlay.hide();
    }
  }

  toggleUserMenu(event: Event) {
    this.userMenuOverlay.toggle(event);
    if (this.notificationsOverlay?.overlayVisible) {
      this.notificationsOverlay.hide();
    }
  }

  handleNotificationClick(notificationId: string) {
    this.notificationsService.markAsRead(notificationId, 'en').subscribe({
      next: () => {
        this.notificationsService.getNotifications('en').subscribe(notifications => {
          this.notifications = notifications;
          this.notificationCount = notifications.length;
        });
        this.notificationsOverlay.hide();
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }

  getSafeUrl(url: string) {
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : '';
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
    this.notificationsService.stopPolling();
  }
}
