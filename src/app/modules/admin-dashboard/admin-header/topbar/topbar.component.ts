import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs';
import { AuthService, UserType } from 'src/app/modules/auth';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent implements OnInit {
  user:UserType;

constructor( private _auth:AuthService,private router:Router){
}
  ngOnInit(): void {
    this._auth.currentUser$.pipe(first()).subscribe((res)=>{
      this.user = res
    })
  }
  signOut(){
    this._auth.logout().pipe(first()).subscribe();
    this.router.navigateByUrl('/auth/login');
  }
}
