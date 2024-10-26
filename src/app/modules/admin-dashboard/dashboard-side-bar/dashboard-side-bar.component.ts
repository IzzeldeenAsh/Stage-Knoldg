import { Component, OnInit } from '@angular/core';
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
  username:string|undefined = ''
  base:string=''
  page:string=''
  roles:any=[]
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
    this._auth.currentUser$.pipe(first()).subscribe((res)=>{
      const user = res
      this.username = user?.name;
      this.roles = user?.roles  ? user?.roles : [];
      console.log('usre',user);
    })
  }
  signOut(){
    this._auth.logout()
  }
  
}