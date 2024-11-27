import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth.service';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class NonInsightersAuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.getProfile().pipe(
      map(user => {
        if (user && (user.roles.includes('company') || user.roles.includes('insighter'))) {
          // User is already registered as company or insighter, redirect them
          this.router.navigate(['/profile']); // Redirect to profile or another appropriate page
          return false;
        }
        // Allow access if user is not registered as company or insighter
        return true;
      }),
      catchError(() => {
        // In case of an error (e.g., not authenticated), allow access or handle accordingly
        this.router.navigate(['/login']); // Redirect to login or another appropriate page
        return [false];
      })
    );
  }
}
