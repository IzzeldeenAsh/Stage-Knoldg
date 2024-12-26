import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from 'src/app/modules/auth';
import { jwtDecode } from 'jwt-decode';

export const authGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const auth = authService.getAuthFromLocalStorage();
  if (auth && auth.authToken) {
    try {
      // Decode the token
      const decodedToken: any = jwtDecode(auth.authToken);
      
      // Check if token is expired
      const currentTime = Date.now() / 1000;
      if (decodedToken.exp && decodedToken.exp > currentTime) {
        // Token exists and is not expired, allow access
        return of(true);
      }
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }

  // No token found or token is expired, redirect to auth page
  localStorage.removeItem('foresighta-creds');
  return of(router.createUrlTree(['/auth']));
};
