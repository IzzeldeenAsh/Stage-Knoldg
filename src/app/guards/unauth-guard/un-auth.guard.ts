import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../modules/auth/services/auth.service';
import { map, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UnAuthGuard {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const authData = this.authService.getAuthFromLocalStorage();
    if (authData && !this.authService.isTokenExpired(authData.authToken)) {
      // Valid token exists, redirect to '/app'
      return this.router.createUrlTree(['/app']);
    }
    
    // No valid token, allow access to auth pages
    return true;
  }
}
