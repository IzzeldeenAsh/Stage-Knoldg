import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-insighter-dashboard',
  templateUrl: './insighter-dashboard.component.html',
  styleUrl: './insighter-dashboard.component.scss'
})
export class InsighterDashboardComponent implements OnInit {
  activeTabIndex: number = 0;
  items: MenuItem[] = [];
  activeItem: MenuItem | undefined;
  
  constructor(private router: Router) {}

  ngOnInit() {
    this.initializeMenuItems();
    
    // Set initial active tab based on current route
    this.setActiveTabFromRoute(this.router.url);

    // Subscribe to route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.setActiveTabFromRoute(event.url);
    });
  }

  initializeMenuItems() {
    this.items = [
      {
        label: 'My Dashboard',
        icon: 'pi pi-home',
        command: () => {
          this.router.navigate(['my-dashboard']);
        }
      },
      {
        label: 'My Requests',
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
        label: 'Account Settings',
        icon: 'pi pi-cog',
        command: () => {
          this.router.navigate(['account-settings']);
        }
      }
    ];
    this.activeItem = this.items[0];
  }

  setActiveTabFromRoute(url: string) {
    if (url.includes('my-dashboard')) {
      this.activeTabIndex = 0;
      this.activeItem = this.items[0];
    }
    else if (url.includes('my-requests')) {
      this.activeTabIndex = 1;
      this.activeItem = this.items[1];
    }
    else if (url.includes('my-knowledge')) {
      this.activeTabIndex = 2;
      this.activeItem = this.items[2];
    }
    else if (url.includes('account-settings')) {
      this.activeTabIndex = 3;
      this.activeItem = this.items[3];
    }
  }

  isRouteActive(route: string): boolean {
    return this.router.url.includes(route);
  }
}
