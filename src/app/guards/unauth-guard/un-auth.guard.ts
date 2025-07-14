import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth.service';
import { map, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UnAuthGuard {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    // Check if user has a valid token using the updated auth service
    const token = this.authService['getTokenFromCookie']();
    
    if (token && !this.authService['isTokenExpired'](token)) {
      // Valid token exists, redirect to '/app'
      return this.router.createUrlTree(['/app']);
    }
    
    // No valid token, allow access to auth pages
    return true;
  }
}
