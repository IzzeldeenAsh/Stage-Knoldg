import { Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener, Renderer2 } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { Router, NavigationEnd } from '@angular/router';
import { TranslationService } from 'src/app/modules/i18n';
import { TranslateService } from '@ngx-translate/core';
import { Notification, NotificationsService } from 'src/app/_fake/services/nofitications/notifications.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { filter } from 'rxjs/operators';

interface CustomMenuItem extends MenuItem {
  expanded?: boolean;
  iconName: string;
  iconClass?: string;
  iconType?: string;
}

interface Industry {
  id: number;
  name: string;
  slug: string;
  children: any[];
}

interface IndustriesResponse {
  data: Industry[];
}

@Component({
  selector: 'app-primeng-header',
  templateUrl: './primeng-header.component.html',
  styleUrls: ['./primeng-header.component.scss']
})
export class PrimengHeaderComponent implements OnInit, OnDestroy {
  @ViewChild('userDropdown') userDropdown: ElementRef;
  @ViewChild('mobileUserDropdown') mobileUserDropdown: ElementRef;
  @ViewChild('userDropdownMenu') userDropdownMenu: ElementRef;
  @ViewChild('userDropdownToggle') userDropdownToggle: ElementRef;

  // Make Math available in the template
  Math = Math;

  items: CustomMenuItem[] = [];
  profile: any;
  sidebarVisible: boolean = false;
  isSmallScreen: boolean = false;
  userMenuItems: MenuItem[] = [];
  isUserDropdownOpen: boolean = false;
  isMobileUserDropdownOpen: boolean = false;
  private breakpointSubscription: Subscription;
  private profileSubscription: Subscription;

  // User profile data
  userName: string = '';
  userEmail: string = '';
  userInitials: string = '';
  userProfileImage: string | null = null;
  lang: string = '';
  
  // Notification related properties
  notifications: Notification[] = [];
  isNotificationsOpen: boolean = false;
  notificationCount: number = 0;
  
  // Industries dropdown
  industries: Industry[] = [];
  isIndustriesMenuOpen: boolean = false;
  
  isDashboardRoute: boolean = false;

  constructor(
    private breakpointObserver: BreakpointObserver,
    private profileService: ProfileService,
    private router: Router,
    private translationService: TranslationService,
    public translate: TranslateService,
    private renderer: Renderer2,
    private notificationService: NotificationsService,
    private http: HttpClient
  ) {
    this.lang = this.translationService.getSelectedLanguage();
  }

  ngOnInit(): void {
    // Check initial screen size
    this.isSmallScreen = this.breakpointObserver.isMatched([
      Breakpoints.XSmall,
      Breakpoints.Small
    ]);

    // Load profile and fetch industries
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.loadUserProfile();
        this.fetchIndustries(); // Fetch industries
        this.initializeMenu(); // Initialize menu after getting profile
        this.onLanguageChange(); // Subscribe to language changes
        
        // Subscribe to notifications
        this.notificationService.notifications$.subscribe((notifications) => {
          this.notifications = notifications;
          this.notificationCount = this.notifications.length;
        });

        // Start polling for notifications
        this.notificationService.startPolling();
      }
    });

    // Subscribe to route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      // Use type assertion here
      const navEvent = event as NavigationEnd;
      // Check if the current URL contains 'dashboard'
      this.isDashboardRoute = navEvent.url.includes('dashboard');
    });
    
    // Also check the initial route
    this.isDashboardRoute = this.router.url.includes('dashboard');
  }

  ngOnDestroy() {
    // Clean up subscriptions to prevent memory leaks
    if (this.breakpointSubscription) {
      this.breakpointSubscription.unsubscribe();
    }
    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }
    
    // Stop polling for notifications
    this.notificationService.stopPolling();
  }

  loadUserProfile() {
    // Get user profile from service
    this.profileSubscription = this.profileService.getProfile().subscribe(
      (profile) => {
        this.userName = profile.name || '';
        this.userEmail = profile.email || '';

        // Set user initials (first letter of first and last name)
        if (this.userName) {
          const nameParts = this.userName.split(' ');
          if (nameParts.length >= 2) {
            this.userInitials = (nameParts[0][0] + nameParts[1][0]).toUpperCase();
          } else {
            this.userInitials = nameParts[0][0].toUpperCase();
          }
        }

        // Check if profile has a profile_photo_url
     if(profile.roles.includes('company') || profile.roles.includes('company-insighter')){
      this.userProfileImage = profile.company?.logo || null;
     }else{
      this.userProfileImage = profile.profile_photo_url || null;
     }
      },
      (error) => {
        console.error('Error loading user profile:', error);
      }
    );
  }

  fetchIndustries() {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': this.lang
    });

    const body = {
      top_industry: 6,
      top_sub_industry: 1
    };

    this.http.post<IndustriesResponse>('https://api.foresighta.co/api/industries/menu', body, { headers })
      .subscribe({
        next: (response) => {
          this.industries = response.data;
        },
        error: (error) => {
          console.error('Error fetching industries:', error);
        }
      });
  }

  getIndustryUrl(industry: Industry): string {
    return `https://knowrland-for-client.vercel.app/en/industry/${industry.id}/${industry.slug}`;
  }

  initializeMenu() {
    // Create industries menu item with dropdown
    const industriesMenuItem: CustomMenuItem = {
      label: this.translate.instant('MENU.INDUSTRIES'),
      iconName: 'element-11',
      iconClass: 'text-primary',
      iconType: 'outline',
      expanded: false,
      items: this.industries.map(industry => ({
        label: industry.name,
        url: this.getIndustryUrl(industry),
        target: '_self'
      }))
    };

    const menuItems = [
      industriesMenuItem, // Add Industries as first item
      {
        label: this.translate.instant('MENU.REPORTS'),
        iconName: '',
        iconClass: 'text-primary',
        iconType: 'outline',
        expanded: false,
        routerLink: 'https://knowrland-for-client.vercel.app/en/industries/report'
      },
      {
        label: this.translate.instant('MENU.INSIGHTS'),
        iconName: '',
        iconClass: 'text-primary',
        iconType: 'outline',
        expanded: false,
        routerLink: 'https://knowrland-for-client.vercel.app/en/industries/insight'
      },
     
      {
        label: this.translate.instant('MENU.DATA'),
        iconName: '',
        iconClass: 'text-primary',
        iconType: 'outline',
        expanded: false,
        routerLink: 'https://knowrland-for-client.vercel.app/en/industries/data'
      },
      {
        label: this.translate.instant('MENU.MANUAL'),
        iconName: '',
        iconClass: 'text-primary',
        iconType: 'outline',
        expanded: false,
        routerLink: 'https://knowrland-for-client.vercel.app/en/industries/manual'
      },
      {
        label: this.translate.instant('MENU.COURSES'),
        iconName: '',
        iconClass: 'text-primary',
        iconType: 'outline',
        expanded: false,
        routerLink: 'https://knowrland-for-client.vercel.app/en/industries/course'
      }
    ];

    // Add the "Add Knowledge" menu item only for specific roles
    // if (this.profile?.roles?.some((role:string) => !['client'].includes(role))) {
    //   menuItems.push({
    //     label: this.translate.instant('MENU.ADD_KNOWLEDGE'),
    //     iconName: 'plus-square',
    //     iconClass: 'text-info fs-2 fw-bold',
    //     iconType: 'duotone',
    //     expanded: false,
    //     routerLink: '/app/add-knowledge/stepper'
    //   });
    // }

    this.items = menuItems;

    this.userMenuItems = [
      {
        label: this.translate.instant('HOME.MY_PROFILE'),
        iconName: 'user',
        iconClass: 'text-primary',
        iconType: 'outline',
        routerLink: '/app/profile'
      },
      {
        label: this.translate.instant('HOME.ACCOUNT_SETTINGS'),
        iconName: 'settings',
        iconClass: 'text-info',
        iconType: 'outline',
        routerLink: '/app/insighter-dashboard/account-settings'
      },
      {
        separator: true
      },
      {
        label: this.translate.instant('HOME.SIGN_OUT'),
        iconName: 'log-out',
        iconClass: 'text-danger',
        iconType: 'outline',
        command: () => {
          // Handle logout
        }
      }
    ] as CustomMenuItem[];
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
    // Close dropdowns when sidebar is toggled
    this.closeAllDropdowns();
  }

  toggleSubmenu(item: CustomMenuItem) {
    item.expanded = !item.expanded;
  }

  toggleUserDropdown(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
    this.isMobileUserDropdownOpen = false;
    this.isNotificationsOpen = false;
  }

  toggleMobileUserDropdown(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.isMobileUserDropdownOpen = !this.isMobileUserDropdownOpen;
    this.isUserDropdownOpen = false;
    this.isNotificationsOpen = false;
  }
  
  // Toggle notifications dropdown
  toggleNotifications(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.isNotificationsOpen = !this.isNotificationsOpen;
    this.isUserDropdownOpen = false;
    this.isMobileUserDropdownOpen = false;
  }

  // Close notifications dropdown
  closeNotifications() {
    this.isNotificationsOpen = false;
  }
  
  // Handle notification click
  handleNotificationClick(notificationId: string) {
    // Close notifications dropdown when clicked
    this.closeNotifications();
    
    // Mark notification as read
    this.notificationService.markAsRead(notificationId, this.lang).subscribe({
      next: () => {
        // Refresh notifications from API
        this.notificationService.getNotifications(this.lang ? this.lang : 'en').subscribe(notifications => {
          this.notifications = notifications;
          this.notificationCount = notifications.length;
        });
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }

  toggleIndustriesMenu(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.isIndustriesMenuOpen = !this.isIndustriesMenuOpen;
    // Close other open menus
    this.isUserDropdownOpen = false;
    this.isMobileUserDropdownOpen = false;
    this.isNotificationsOpen = false;
  }

  closeIndustriesMenu() {
    this.isIndustriesMenuOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    // Close user dropdown when clicking outside
    if (this.isUserDropdownOpen && this.userDropdownToggle && this.userDropdownMenu) {
      const target = event.target as HTMLElement;
      if (!this.userDropdownToggle.nativeElement.contains(target) && !this.userDropdownMenu.nativeElement.contains(target)) {
        this.isUserDropdownOpen = false;
      }
    }

    // Close mobile user dropdown when clicking outside
    if (this.isMobileUserDropdownOpen && this.mobileUserDropdown) {
      const target = event.target as HTMLElement;
      if (!this.mobileUserDropdown.nativeElement.contains(target)) {
        this.isMobileUserDropdownOpen = false;
      }
    }
    
    // Close notifications dropdown when clicking outside
    if (this.isNotificationsOpen) {
      const target = event.target as HTMLElement;
      // Check if the click is outside the notification area
      if (!target.closest('.notification-dropdown') && !target.closest('.notification-toggle')) {
        this.closeNotifications();
      }
    }

    // Close industries dropdown when clicking outside
    if (this.isIndustriesMenuOpen) {
      const target = event.target as HTMLElement;
      if (!target.closest('.industries-dropdown') && !target.closest('.industries-toggle')) {
        this.closeIndustriesMenu();
      }
    }
  }

  onLanguageChange() {
    this.translationService.onLanguageChange().subscribe(lang => {
      this.lang = lang || 'en';
      // Re-initialize menu to update translations
      this.initializeMenu();
    });
  }

  closeAllDropdowns() {
    this.isUserDropdownOpen = false;
    this.isMobileUserDropdownOpen = false;
    this.isNotificationsOpen = false;
    this.isIndustriesMenuOpen = false;
  }
}
