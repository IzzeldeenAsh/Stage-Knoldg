import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { catchError, first, Observable, throwError } from 'rxjs';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { AuthHTTPService } from './services/auth-http/auth-http.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router,
    private getProfileService: ProfileService,
    private authHttpService: AuthHTTPService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // For all requests to knoldg.com or app.knoldg.com domains,
    // include credentials (cookies) in the request
    if (req.url.includes('knoldg.com') || req.url.includes('foresighta.co')) {
      req = req.clone({
        withCredentials: true
      });
    }

    // Get auth token from cookie using the AuthHTTPService
    const token = this.authHttpService.getAuthToken();

    // If no auth token is available, forward the request without modification
    if (!token) {
      return next.handle(req);
    }

    // Clone the request and add the authorization header
    const clonedReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });

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
        }
        return throwError(() => error);
      })
    );
  }
}