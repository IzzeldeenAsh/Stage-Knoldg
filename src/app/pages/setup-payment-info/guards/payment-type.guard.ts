import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { PaymentService } from '../../../_fake/services/payment/payment.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentTypeGuard implements CanActivate {

  constructor(
    private paymentService: PaymentService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const expectedType = this.getExpectedTypeFromRoute(state.url);
    
    if (!expectedType) {
      return of(true); // Allow access if we can't determine expected type
    }

    // Try to get account details to check the type
    return this.paymentService.getAccountDetails().pipe(
      map(response => {
        if (response.data.primary.type === expectedType) {
          return true;
        } else {
          // Redirect to the main setup payment page if type doesn't match
          this.router.navigate(['/setup-payment-info']);
          return false;
        }
      }),
      catchError(() => {
        // If API call fails, redirect to main setup page
        this.router.navigate(['/setup-payment-info']);
        return of(false);
      })
    );
  }

  private getExpectedTypeFromRoute(url: string): 'manual' | 'provider' | null {
    if (url.includes('manual-account')) {
      return 'manual';
    } else if (url.includes('stripe-callback')) {
      return 'provider';
    }
    return null;
  }
}
