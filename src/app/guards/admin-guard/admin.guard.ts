import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, first } from 'rxjs/operators';
import { AuthService } from 'src/app/modules/auth/services/auth.service';

export const adminGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.getProfile().pipe(
    first(),
    map(user => {
      if (user && (user.roles.includes('admin') || user.roles.includes('staff'))) {
        // User has the required role, allow access
        return true;
      } else {
        // User does not have the required role, redirect to login
        localStorage.removeItem('foresighta-creds');
        return router.createUrlTree(['/auth/login']);
      }
    }),
    catchError(() => {
      // On error (e.g., token invalid), redirect to login
      localStorage.removeItem('foresighta-creds');
      return of(router.createUrlTree(['/auth/login']));
    })
  );
};
