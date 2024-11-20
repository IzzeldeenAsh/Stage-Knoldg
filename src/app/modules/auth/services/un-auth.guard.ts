import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { catchError, first, map, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UnAuthGuard  {
  constructor(private authService: AuthService,private router:Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const authData =this.authService.getAuthFromLocalStorage();
    if(authData){
      return false
    }else{
      return true
    }
    // return this.authService.getProfile().pipe(
    //   map(user => {
    //     if (user && user.verified) {
    //       // User is authenticated, redirect to '/app'
    //       return this.router.createUrlTree(['/app']);
    //     } else {
    //       // User is not authenticated, allow access
    //       localStorage.removeItem('foresighta-creds');
    //       return true;
    //     }
    //   }),
    //   catchError(() => {
    //     // In case of error, allow access;
    //      localStorage.removeItem('foresighta-creds')
    //     return of(true);
    //   })
    // )
  }
}
