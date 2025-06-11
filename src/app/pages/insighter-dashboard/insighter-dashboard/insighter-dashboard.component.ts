import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map, take } from 'rxjs/operators';
import { MenuItem } from 'primeng/api';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { Observable } from 'rxjs';

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
  
  constructor(
    private router: Router,
    private profileService: ProfileService
  ) {
    this.hasCompanyRole$ = this.profileService.hasRole(['company']);
  }

  ngOnInit() {
    // Initialize menu items after checking roles
    this.hasCompanyRole$.pipe(take(1)).subscribe(hasCompanyRole => {
      this.initializeMenuItems(hasCompanyRole);
      
      // Set initial active tab based on current route
      this.setActiveTabFromRoute(this.router.url);
    });

    // Subscribe to route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.setActiveTabFromRoute(event.url);
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
}
