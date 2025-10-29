// roles.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';

@Injectable({ providedIn: 'root' })
export class RolesGuard implements CanActivate {
  constructor(private getProfileService: ProfileService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    // Retrieve the required roles from route data
    const requiredRoles: string[] = route.data.roles;
    return this.getProfileService.getProfile().pipe(
      map(user => {
        if (user && requiredRoles.some(role => user.roles.includes(role))) {
          // User has at least one of the required roles
          return true;
        }
        // User lacks the required roles, redirect accordingly
        return this.router.createUrlTree(['/app/profile']);
      }),
      catchError(() => {
        // Handle errors, such as unauthenticated users
        // Save the URL the user is trying to access
        const url = state.url;
        console.log('Roles Guard - Redirecting to login with returnUrl:', url);
        // Return router URL tree with returnUrl
        return of(this.router.createUrlTree(['/auth/login'], { 
          queryParams: { returnUrl: url } 
        }));
      })
    );
  }
}
