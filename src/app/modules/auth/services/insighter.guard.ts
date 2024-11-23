// insighter.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class InsighterGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.getProfile().pipe(
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
