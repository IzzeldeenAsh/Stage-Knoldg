import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth.service';
import { first, map } from 'rxjs';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';

@Injectable({ providedIn: 'root' })
export class authGuard  {
  constructor(private getProfileService: ProfileService, private router:Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    return this.getProfileService.getProfile().pipe(
      map(user=>{
        if (user && user.verified) {
          // User is authenticated, allow access
          return true;
        }else{
          localStorage.removeItem('foresighta-creds');
          // Save the URL the user is trying to access
          const url = state.url;
          console.log('Auth Guard - Redirecting to login with returnUrl:', url);
          // Return the router URL tree with the returnUrl query parameter
          return this.router.createUrlTree(['/auth/login'], { 
            queryParams: { returnUrl: url } 
          });
        }
      })
    )
  }
}
