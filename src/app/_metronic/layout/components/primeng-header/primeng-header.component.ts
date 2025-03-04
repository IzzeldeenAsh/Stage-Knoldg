import { Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener, Renderer2 } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subscription } from 'rxjs';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import {  Router } from '@angular/router';
import { TranslationService } from 'src/app/modules/i18n';
import { TranslateService } from '@ngx-translate/core';

interface CustomMenuItem extends MenuItem {
  expanded?: boolean;
  iconName: string;
  iconClass?: string;
  iconType?: string;
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

  items: CustomMenuItem[] = [];
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
  constructor(
    private breakpointObserver: BreakpointObserver,
    private profileService: ProfileService,
    private router: Router,
    private translationService: TranslationService,
    private translate: TranslateService,
    private renderer: Renderer2
  ) {
    this.lang = this.translationService.getSelectedLanguage();
    this.breakpointSubscription = this.breakpointObserver.observe([
      Breakpoints.XSmall,
      Breakpoints.Small
    ]).subscribe(result => {
      this.isSmallScreen = result.matches;
      // Close sidebar when switching to desktop view
      if (!this.isSmallScreen) {
        this.sidebarVisible = false;
      }
    });
  }

  ngOnInit(): void {
    // Check initial screen size
    this.isSmallScreen = this.breakpointObserver.isMatched([
      Breakpoints.XSmall,
      Breakpoints.Small
    ]);

    // Load user profile
    this.loadUserProfile();

    this.initializeMenu();
    this.onLanguageChange(); // Subscribe to language changes
  }

  ngOnDestroy() {
    // Clean up subscriptions to prevent memory leaks
    if (this.breakpointSubscription) {
      this.breakpointSubscription.unsubscribe();
    }
    if (this.profileSubscription) {
      this.profileSubscription.unsubscribe();
    }
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
     if(profile.roles.includes('company')){
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

  initializeMenu() {
    this.items = [
    
      {
        label: this.translate.instant('MENU.INSIGHTS'),
        iconName: 'chart-line',
        iconClass: 'text-primary',
        iconType: 'outline',
        expanded: false,
        routerLink: 'https://knowrland-for-client.vercel.app/en/industries/insight'
      },
      {
        label: this.translate.instant('MENU.REPORTS'),
        iconName: 'document',
        iconClass: 'text-primary',
        iconType: 'outline',
        expanded: false,
        routerLink: 'https://knowrland-for-client.vercel.app/en/industries/report'
      },
    
      {
        label: this.translate.instant('MENU.DATA'),
        iconName: 'data',
        iconClass: 'text-primary',
        iconType: 'outline',
        expanded: false,
        routerLink: 'https://knowrland-for-client.vercel.app/en/industries/data'
      },
      {
        label: this.translate.instant('MENU.MANUAL'),
        iconName: 'book',
        iconClass: 'text-primary',
        iconType: 'outline',
        expanded: false,
        routerLink: 'https://knowrland-for-client.vercel.app/en/industries/manual'
      },
      {
        label: this.translate.instant('MENU.COURSES'),
        iconName: 'teacher',
        iconClass: 'text-primary',
        iconType: 'outline',
        expanded: false,
        routerLink: 'https://knowrland-for-client.vercel.app/en/industries/course'
      }
    ];

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

  toggleUserDropdown(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.isUserDropdownOpen = !this.isUserDropdownOpen;
    // Close other dropdowns
    this.isMobileUserDropdownOpen = false;
  }

  toggleMobileUserDropdown(event: Event) {
    event.stopPropagation();
    this.isMobileUserDropdownOpen = !this.isMobileUserDropdownOpen;
    this.isUserDropdownOpen = false;
  }

  closeAllDropdowns() {
    this.isUserDropdownOpen = false;
    this.isMobileUserDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  handleDocumentClick(event: Event): void {
    // Check if click is outside user dropdown
    if (this.isUserDropdownOpen && this.userDropdownMenu && this.userDropdownToggle) {
      const target = event.target as HTMLElement;
      const clickedInsideDropdown = this.userDropdownMenu.nativeElement.contains(target);
      const clickedOnToggle = this.userDropdownToggle.nativeElement.contains(target);

      if (!clickedInsideDropdown && !clickedOnToggle) {
        this.isUserDropdownOpen = false;
      }
    }

    // Check if click is outside mobile user dropdown
    if (this.isMobileUserDropdownOpen && this.userDropdown && this.mobileUserDropdown) {
      const target = event.target as HTMLElement;
      const clickedInsideDropdown = this.userDropdown.nativeElement.contains(target);
      const clickedOnToggle = this.mobileUserDropdown.nativeElement.contains(target);

      if (!clickedInsideDropdown && !clickedOnToggle) {
        this.isMobileUserDropdownOpen = false;
      }
    }
  }

  onLanguageChange() {
    this.translationService.onLanguageChange().subscribe(() => {
      this.lang = this.translationService.getSelectedLanguage();
      this.initializeMenu(); // Reinitialize menu with new language
    });
  }
}
