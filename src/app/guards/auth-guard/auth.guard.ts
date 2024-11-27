import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth.service';
import { first, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthGuard  {
  constructor(private authService: AuthService, private router:Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.authService.getProfile().pipe(
      map(user=>{
        if (user && user.verified) {
          // User is authenticated, allow access
          return true;
        }else{
          localStorage.removeItem('foresighta-creds');
           this.router.createUrlTree(['/auth']);
           return false
        }
      })
    )
  }
}
