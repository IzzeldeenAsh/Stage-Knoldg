import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { catchError, first, Observable, throwError } from 'rxjs';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { AuthHTTPService } from './services/auth-http/auth-http.service';
import { ToastService } from 'src/app/_fake/services/toast-service/toast.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router,
    private getProfileService: ProfileService,
    private authHttpService: AuthHTTPService,
    private toastService: ToastService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Get auth token from localStorage
    const token = this.authService.getAuthFromLocalStorage()?.authToken;

    // Clone the request and add the token if it exists
    let clonedReq = req;
    if (token) {
      clonedReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
    }

    return next.handle(clonedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.authService.handleLogout().subscribe({
            next: () => {
              this.getProfileService.clearProfile();
              this.router.navigate(['/auth']).then(() => {
                // Optional: Reload the page after navigation if needed
                window.location.reload();
              });
            },
            error: (err) => {
              console.error('Logout error:', err);
            }
          });
        } else if (error.status === 403) {
          // Check for email verification error
          if (error.error && error.error.message === "Your email address is not verified.") {
            this.toastService.error(error.error.message, "Account Issue");
            
            // Perform logout
            this.authService.handleLogout().subscribe({
              next: () => {
                this.getProfileService.clearProfile();
                this.router.navigate(['/auth']).then(() => {
                  // Optional: Reload the page after navigation if needed
                  window.location.reload();
                });
              },
              error: (err) => {
                console.error('Logout error:', err);
              }
            });
          }
        } else if (error.status === 0) {
          // Status 0 often indicates CORS issues
          console.error('Possible CORS issue:', error);
        }
        return throwError(() => error);
      })
    );
  }
}