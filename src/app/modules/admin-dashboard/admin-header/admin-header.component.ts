import { Component } from '@angular/core';
import { Router, NavigationEnd, NavigationSkipped } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { first } from 'rxjs';

@Component({
  selector: 'app-admin-header',
  templateUrl: './admin-header.component.html',
  styleUrls: ['./admin-header.component.scss']
})
export class AdminHeaderComponent {
  sidebarVisible: boolean = false;
  toggleMobileSideBar(): void {
    this.sidebarVisible = !this.sidebarVisible
  }
  base:string=''
  page:string=''
  constructor(     public router: Router,
    private _auth:AuthService){
    
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


}
