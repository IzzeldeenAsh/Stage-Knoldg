import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { PaymentService, PaymentDetailsResponse } from '../../../_fake/services/payment/payment.service';

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

    // For stripe-callback routes, always allow access without any checks
    if (expectedType === 'provider') {
      return of(true);
    }

    // For manual account routes, check if user has manual account
    return this.paymentService.getPaymentAccountDetails().pipe(
      map((response: PaymentDetailsResponse) => {
        const primaryAccount = response.data.find(account => account.primary);
        if (primaryAccount?.type === expectedType) {
          return true;
        }
        
        // Redirect to the main setup payment page if type doesn't match
        this.router.navigate(['/app/setup-payment-info']);
        return false;
      }),
      catchError(() => {
        // If API call fails, redirect to main setup page
        this.router.navigate(['/app/setup-payment-info']);
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
