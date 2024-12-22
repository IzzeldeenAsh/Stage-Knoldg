import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth.service';
import { catchError, first, map, of } from 'rxjs';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';

@Injectable({ providedIn: 'root' })
export class UnAuthGuard  {
  constructor(private getProfileService: ProfileService,private router:Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.getProfileService.getProfile().pipe(
      map(user => {
        if (user && user.verified) {
          // User is authenticated, redirect to '/app'
          return this.router.createUrlTree(['/app']);
        } else {
          // User is not authenticated, allow access
          localStorage.removeItem('foresighta-creds');
          return true;
        }
      }),
      catchError(() => {
        // In case of error, allow access;
         localStorage.removeItem('foresighta-creds')
        return of(true);
      })
    )
  }
}
