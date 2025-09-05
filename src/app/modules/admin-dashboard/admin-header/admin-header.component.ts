import { Component } from '@angular/core';
import { Router, NavigationEnd, NavigationSkipped } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { first } from 'rxjs';

interface BreadcrumbItem {
  label: string;
  url?: string;
  active?: boolean;
}

@Component({
  selector: 'app-admin-header',
  templateUrl: './admin-header.component.html',
  styleUrls: ['./admin-header.component.scss']
})
export class AdminHeaderComponent {
  sidebarVisible: boolean = false;
  breadcrumbs: BreadcrumbItem[] = [];
  
  toggleMobileSideBar(): void {
    this.sidebarVisible = !this.sidebarVisible
  }
  
  isSidebarHidden: boolean = false;
  
  private routeLabels: { [key: string]: string } = {
    'admin-dashboard': 'KNOLDG Admin',
    'dashboard': 'Dashboard',
    'main-dashboard': 'Management',
    'requests': 'Requests',
    'departments': 'Departments',
    'positions': 'Positions',
    'countries': 'Countries',
    'regions': 'Regions',
    'consulting-fields': 'Consulting Fields',
    'ISIC-code': 'ISIC Code',
    'industries': 'Industries',
    'tags': 'Tags',
    'topics': 'Topics',
    'hscode': 'HS Code',
    'guidelines': 'Guidelines',
    'accounts': 'Accounts',
    'main-accounts': 'User Management',
    'staff': 'Staff',
    'roles': 'Roles',
    'permissions': 'Permissions',
    'users': 'Users',
    'my-settings': 'Settings',
    'resetpassword': 'Change Password',
    'contact-messages': 'Communication',
    'contact-list': 'Contact Messages'
  };
  
  constructor( 
    public router: Router,
    private _auth: AuthService
  ){
    this.updateBreadcrumbs(this.router.url);
    
    router.events.subscribe((event: Object) => {
      if(event instanceof NavigationEnd || event instanceof NavigationSkipped){
        this.updateBreadcrumbs(event.url);
      }
    });
  }

  ngOnInit(): void {
    this.updateBreadcrumbs(this.router.url);
  }

  private updateBreadcrumbs(url: string): void {
    const segments = url.split('/').filter(segment => segment);
    this.breadcrumbs = [];

    let currentPath = '';
    
    segments.forEach((segment, index) => {
      currentPath += '/' + segment;
      const label = this.routeLabels[segment] || this.formatLabel(segment);
      const isLast = index === segments.length - 1;
      
      this.breadcrumbs.push({
        label,
        url: isLast ? undefined : currentPath,
        active: isLast
      });
    });
  }

  private formatLabel(segment: string): string {
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

}
