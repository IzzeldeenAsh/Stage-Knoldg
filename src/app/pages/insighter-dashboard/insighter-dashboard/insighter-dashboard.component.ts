import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map, take } from 'rxjs/operators';
import { MenuItem } from 'primeng/api';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { Observable } from 'rxjs';
import { TranslationService } from 'src/app/modules/i18n';

@Component({
  selector: 'app-insighter-dashboard',
  templateUrl: './insighter-dashboard.component.html',
  styleUrls: ['./insighter-dashboard.component.scss']
})
export class InsighterDashboardComponent implements OnInit {
  activeTabIndex: number = 0;
  items: MenuItem[] = [];
  activeItem: MenuItem | undefined;
  hasCompanyRole$: Observable<boolean>;
  isClient$: Observable<any>;
  panelMenuItems: MenuItem[] = [];
  lang: string = 'en';
  isMeetingsExpanded: boolean = false;
  constructor(
    private router: Router,
    private profileService: ProfileService,
    private translationService: TranslationService
  ) {
    this.hasCompanyRole$ = this.profileService.hasRole(['company']);
  }

  ngOnInit() {
    this.handleLanguage();
    // Initialize menu items after checking roles
    this.hasCompanyRole$.pipe(take(1)).subscribe(hasCompanyRole => {
      this.initializeMenuItems(hasCompanyRole);
      this.buildPanelMenu(hasCompanyRole);
      
      // Set initial active tab based on current route
      this.setActiveTabFromRoute(this.router.url);
      
      // Check if we're on a meetings route to expand the meetings section
      this.checkMeetingsRoute(this.router.url);
    });
   this.isClient$ = this.profileService.isClient()
    
    // Subscribe to route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.setActiveTabFromRoute(event.url);
      this.checkMeetingsRoute(event.url);
    });
  }

  handleLanguage() {
    this.lang = this.translationService.getSelectedLanguage();
    this.translationService.onLanguageChange().subscribe((lang) => {
      this.lang = lang;
      // Rebuild menu when language changes
      this.hasCompanyRole$.pipe(take(1)).subscribe(hasCompanyRole => {
        this.buildPanelMenu(hasCompanyRole);
      });
    });
  }

  buildPanelMenu(hasCompanyRole: boolean) {
    this.panelMenuItems = [
      {
        label: this.translationService.getTranslation('INSIGHTER.DASHBOARD.NAV.DASHBOARD') || 'Dashboard',
        icon: 'pi pi-home',
        items: [
          {
            label: this.translationService.getTranslation('INSIGHTER.DASHBOARD.NAV.OVERVIEW') || 'Overview',
            icon: 'pi pi-chart-line',
            routerLink: '/app/dashboard/my-dashboard'
          }
        ]
      },
      {
        label: this.translationService.getTranslation('INSIGHTER.DASHBOARD.NAV.REQUESTS') || 'Requests & Knowledge',
        icon: 'pi pi-file',
        items: [
          {
            label: this.translationService.getTranslation('INSIGHTER.DASHBOARD.NAV.MY_REQUESTS') || 'My Requests',
            icon: 'pi pi-list',
            routerLink: '/app/dashboard/my-requests'
          },
          {
            label: this.translationService.getTranslation('INSIGHTER.DASHBOARD.NAV.MY_KNOWLEDGE') || 'My Knowledge',
            icon: 'pi pi-book',
            routerLink: '/app/dashboard/my-knowledge'
          },
          {
            label: this.translationService.getTranslation('INSIGHTER.DASHBOARD.NAV.MY_DOWNLOADS') || 'My Downloads',
            icon: 'pi pi-download',
            routerLink: '/app/dashboard/my-downloads'
          }
        ]
      }
    ];

    // Add company section if user has company role
    if (hasCompanyRole) {
      this.panelMenuItems.push({
        label: this.translationService.getTranslation('INSIGHTER.DASHBOARD.NAV.COMPANY') || 'Company',
        icon: 'pi pi-building',
        items: [
          {
            label: this.translationService.getTranslation('INSIGHTER.DASHBOARD.NAV.MY_COMPANY') || 'My Company',
            icon: 'pi pi-users',
            routerLink: '/app/dashboard/my-company-settings'
          }
        ]
      });
    }

    // Add settings section
    this.panelMenuItems.push({
      label: this.translationService.getTranslation('INSIGHTER.DASHBOARD.NAV.SETTINGS') || 'Settings',
      icon: 'pi pi-cog',
      items: [
        {
          label: this.translationService.getTranslation('INSIGHTER.DASHBOARD.NAV.ACCOUNT_SETTINGS') || 'Account Settings',
          icon: 'pi pi-user-edit',
          routerLink: '/app/dashboard/account-settings'
        }
      ]
    });
  }

  initializeMenuItems(hasCompanyRole: boolean) {
    this.items = [
      {
        label: 'My Dashboard',
        icon: 'pi pi-home',
        command: () => {
          this.router.navigate(['my-dashboard']);
        }
      },
      {
        label: 'Requests',
        icon: 'pi pi-list',
        command: () => {
          this.router.navigate(['my-requests']);
        }
      },
      {
        label: 'My Knowledge',
        icon: 'pi pi-book',
        command: () => {
          this.router.navigate(['my-knowledge']);
        }
      },
      {
        label: 'My Downloads',
        icon: 'pi pi-download',
        command: () => {
          this.router.navigate(['my-downloads']);
        }
      }
    ];

    if (hasCompanyRole) {
      this.items.push({
        label: 'My Team',
        icon: 'pi pi-building',
        command: () => {
          this.router.navigate(['my-company-settings']);
        }
      });
    }

    this.items.push({
      label: 'Account Settings',
      icon: 'pi pi-cog',
      command: () => {
        this.router.navigate(['account-settings']);
      }
    });

    this.activeItem = this.items[0];
  }

  setActiveTabFromRoute(url: string) {
    const routes = ['my-dashboard', 'my-requests', 'my-knowledge', 'my-downloads', 'my-company-settings', 'account-settings'];
    const index = routes.findIndex(route => url.includes(route));
    if (index !== -1) {
      this.activeTabIndex = index;
      this.activeItem = this.items[index];
    }
  }

  isRouteActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  isSubRouteActive(route: string, subRoute: string): boolean {
    return this.router.url.includes(route) && this.router.url.includes(subRoute);
  }

  toggleMeetings(): void {
    this.isMeetingsExpanded = !this.isMeetingsExpanded;
  }

  checkMeetingsRoute(url: string): void {
    // Auto-expand meetings section if we're on a meetings route
    if (url.includes('my-meetings')) {
      this.isMeetingsExpanded = true;
    }
  }
}
