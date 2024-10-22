import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

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

    return next.handle(clonedReq); // Pass the cloned request with headers to the next handler
  }
}