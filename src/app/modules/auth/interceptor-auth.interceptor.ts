import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ToastService } from 'src/app/_fake/services/toast-service/toast.service';
import { CookieService } from './services/cookie.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private toastService: ToastService,
    private cookieService: CookieService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Get auth token from cookie using the cookie service
    const token = this.cookieService.getCookie('token');

    // Get user's timezone
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Clone the request and add the token and timezone if available
    let clonedReq = req;
    
    if (token) {
      clonedReq = req.clone({
        headers: req.headers
          .set('Authorization', `Bearer ${token}`)
          .set('X-Timezone', timezone)
      });
    } else {
      // Even if no token, still add timezone header
      clonedReq = req.clone({
        headers: req.headers.set('X-Timezone', timezone)
      });
    }

    return next.handle(clonedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          // Handle unauthorized - token expired or invalid
          this.handleUnauthorized();
        } else if (error.status === 403) {
          // Handle forbidden - check for email verification error
          this.handleForbidden(error);
        } else if (error.status === 0) {
          // Status 0 often indicates CORS issues
          console.error('Possible CORS issue:', error);
        }
        
        return throwError(() => error);
      })
    );
  }

  private handleUnauthorized(): void {
    console.log('Unauthorized access - redirecting to login');
    
    // Clear auth data directly without making HTTP calls
    this.clearAuthData();
    
    // Navigate to login
    this.router.navigate(['/auth/login']).then(() => {
      // Optional: Show message to user
      this.toastService.warning('Your session has expired. Please log in again.', 'Session Expired');
    });
  }

  private handleForbidden(error: HttpErrorResponse): void {
    // Check for email verification error
    if (error.error && error.error.message === "Your email address is not verified.") {
      const currentUrl = this.router.url;
      
      // Don't redirect if user is already on auth-related routes
      if (currentUrl.includes('/auth/verify-email') || 
          currentUrl.includes('/auth/email-reconfirm') || 
          currentUrl.includes('/auth/callback')) {
        console.log('User is on auth route, not redirecting for email verification error');
        // Just show the error message, don't redirect
        this.toastService.error(error.error.message, "Account Issue");
        return;
      }
      
      this.toastService.error(error.error.message, "Account Issue");
      
      // Navigate to email verification page only if not already on auth route
      this.router.navigate(['/auth/email-reconfirm']);
    } else {
      // For other forbidden errors, show generic message
      this.toastService.error('Access denied. You do not have permission to perform this action.', 'Access Denied');
    }
  }

  private clearAuthData(): void {
    // Clear the token cookie
    this.cookieService.deleteCookie('token');
    
    // Clear localStorage data
    localStorage.removeItem('foresighta-creds');
    localStorage.removeItem('currentUser');
    
    // Clear any other auth-related data
    sessionStorage.clear();
  }
}