import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { catchError, first, Observable, throwError } from 'rxjs';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService,private router:Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const auth = this.authService.getAuthFromLocalStorage();

    // If no auth token is available, forward the request without modification
    if (!auth || !auth.authToken) {
      return next.handle(req);
    }

    // Clone the request and add the authorization header
    const clonedReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${auth.authToken}`)
    });

    return next.handle(clonedReq).pipe(
      catchError((error:HttpErrorResponse)=>{
        if(error.status === 401){
          this.authService.logout().pipe(
            first()
          ).subscribe({
            next: () => {
              localStorage.removeItem("foresighta-creds");
              localStorage.removeItem("user");
              this.router.navigate(['/auth']).then(() => {
                // Optional: Reload the page after navigation if needed
               window.location.reload();
              });
            },
            error: (error) => {
              console.error('Logout error:', error);
            }
          });
        }
        return throwError(()=>error);
      })
    ); // Pass the cloned request with headers to the next handler
  }
}