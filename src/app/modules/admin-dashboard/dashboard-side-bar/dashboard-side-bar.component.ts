import { Component, Input, OnInit } from '@angular/core';
import { NavigationEnd, NavigationSkipped, Router } from '@angular/router';
import { AuthService } from '../../auth';
import { first } from 'rxjs';

@Component({
  selector: 'app-dashboard-side-bar',
  templateUrl: './dashboard-side-bar.component.html',
  styleUrl: './dashboard-side-bar.component.scss'
})
export class DashboardSideBarComponent implements OnInit {
  isSidebarHidden: boolean = false; // Sidebar is visible by default for larger screens
  @Input() isMobile:boolean=false;
  activeMenu: string | null = null;

  // Example state variables (optional if using activeMenu)
  isCPanelActive: boolean = false;
  isAccountActive: boolean = false;
  isSettingsActive: boolean = false;

  // Collapse state for categories
  collapsedCategories: { [key: string]: boolean } = {
    notifications: false,
    users: false,
    content: false,
    financial: false,
    settings: false
  };

  base:string=''
  page:string=''
  constructor( 
    public router: Router,
    private _auth:AuthService
  
  ){
    router.events.subscribe((event:Object)=>{
      if(event instanceof NavigationEnd){
        const splitVal =event.url.split('/');
        this.base = splitVal[3];
        this.page=splitVal[2];
        
      } else if(event instanceof NavigationSkipped){
        const splitVal = event.url.split('/');
        this.page = splitVal[2];
        this.base = splitVal[3];
      }
    })

  }

  ngOnInit(): void {
    this.base=this.router.url.split('/')[3];

  }

  toggleCategory(category: string): void {
    this.collapsedCategories[category] = !this.collapsedCategories[category];
  }

  isCategoryActive(categoryRoutes: string[]): boolean {
    const currentUrl = this.router.url;
    return categoryRoutes.some(route => currentUrl.includes(route));
  }

}