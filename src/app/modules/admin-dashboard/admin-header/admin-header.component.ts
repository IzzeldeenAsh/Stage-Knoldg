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
  roles:any=[]
  base:string=''
  page:string=''
  username:string|undefined = ''
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
