import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ActivationEnd, ChildActivationStart, NavigationEnd, NavigationSkipped, Router, Scroll } from '@angular/router';
import { environment } from 'src/environments/environment';
interface AsideMenuLinkInterface{
  icon:string;
  color:string;
  title:string;
  link:string
}
@Component({
  selector: 'app-aside-menu',
  templateUrl: './aside-menu.component.html',
  styleUrls: ['./aside-menu.component.scss'],
})
export class AsideMenuComponent implements OnInit {
  base:string='';
  appAngularVersion: string = environment.appVersion;
  appPreviewChangelogUrl: string = environment.appPreviewChangelogUrl;
  dashboardLinks:AsideMenuLinkInterface[]=[
    {
      icon:'./assets/media/icons/figmaSVGs/summary.svg',
      color:'svg-icon-warning',
      title:'Summary',
      link:'/admin-dashboard/admin/dashboard/main-dashboard'
    },
    {
      icon:'./assets/media/icons/figmaSVGs/email.svg',
      color:'svg-icon-success',
      title:'Messages',
      link:'/admin-dashboard/admin/dashboard/main-dashboard/messages'
    } ,
    {
      icon:'./assets/media/icons/figmaSVGs/reports.svg',
      color:'svg-icon-primary',
      title:'Reports',
      link:'/admin-dashboard/admin/dashboard/main-dashboard/reports'
    },
    {
      icon:'./assets/media/icons/figmaSVGs/statistics.svg',
      color:'svg-icon-danger',
      title:'Statistics',
      link:'/admin-dashboard/admin/dashboard/main-dashboard/statistics'
    },
    {
      icon:'./assets/media/icons/figmaSVGs/edit.svg',
      color:'svg-icon-info',
      title:'Company Settings',
      link:'/admin-dashboard/admin/dashboard/main-dashboard/co-settings'
    }
  ]
  casesLinks:AsideMenuLinkInterface[]=[
    {
      icon:'./assets/media/icons/duotune/abstract/abs027.svg',
      color:'svg-icon-primary',
      title:'Cases List',
      link:'/admin-dashboard/admin/cases/main-cases/cases-list'
    },
    {
      icon:'./assets/media/icons/figmaSVGs/claims.svg',
      color:'svg-icon-warning',
      title:'Cases Claims',
      link:'/admin-dashboard/admin/cases/main-cases/cases-claims'
    },
    {
      icon:'./assets/media/icons/figmaSVGs/statistics.svg',
      color:'svg-icon-info',
      title:'Cases Statistics',
      link:'/admin-dashboard/admin/cases/main-cases/cases-statistics'
    },
    {
      icon:'./assets/media/icons/figmaSVGs/deleted.svg',
      color:'svg-icon-danger',
      title:'Deleted Cases',
      link:'/admin-dashboard/admin/cases/main-cases/deleted-cases'
    }
  ]
  financeLinks:AsideMenuLinkInterface[]=[
    {
      icon:'./assets/media/icons/figmaSVGs/fees.svg',
      color:'svg-icon-primary',
      title:'Fees Control',
      link:'/admin-dashboard/admin/finance/main-finance/fees-control'
    }
  ]
  constructor(public router: Router){
    router.events.subscribe((event:any)=>{
      if(event instanceof NavigationEnd || event instanceof NavigationSkipped  ){
        const splitVal =event.url.split('/');
        this.base = splitVal[3];
      } else if(event instanceof Scroll){
        const splitVal= event.routerEvent.url.split('/');
        this.base = splitVal[3];
      }
    })}

  ngOnInit(): void {
  this.router.navigate(['/admin-dashboard/admin/dashboard/main-dashboard']);
  }
}
