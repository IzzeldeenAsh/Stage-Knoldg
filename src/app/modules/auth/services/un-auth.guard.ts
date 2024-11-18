import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { first } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UnAuthGuard  {
  constructor(private authService: AuthService,private router:Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    this.authService.getProfile().pipe(first()).subscribe({
      next:(user)=>{
        if(user && user.verified){
          this.router.navigate(['/app'])
          return false;
        }else{
          this.authService.handleLogout();
          this.router.navigate(['auth']);
          return true
        }
      },
      error :(error)=>{
        this.authService.handleLogout();
        this.router.navigate(['auth']);
        return true
      }
    })
  //   const currentUser = this.authService.currentUserValue;
  //   if (!currentUser) {
  //     // logged in so return true
  //     return true;
  //   }
  //   this.router.navigate(['/app'])
  //   return false;
  // }
  }
}
