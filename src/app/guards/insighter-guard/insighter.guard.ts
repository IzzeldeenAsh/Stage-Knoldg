// insighter.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';

@Injectable({ providedIn: 'root' })
export class InsighterGuard implements CanActivate {
  constructor(private getProfileService: ProfileService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.getProfileService.getProfile().pipe(
      map(user => {
        if (user && user.roles.includes('insighter')) {
          // User has 'insighter' role, deny access
          return true;
        }
        // Allow access
        this.router.navigate(['/app']); // Redirect as needed
        return false;
      }),
      catchError(() => {
        // Handle error, possibly unauthenticated user
        this.router.navigate(['/login']); // Redirect as needed
        return of(false);
      })
    );
  }
}
