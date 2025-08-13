import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { TranslationService } from 'src/app/modules/i18n/translation.service';

export interface StripeCountry {
  id: number;
  name: string;
  flag: string;
}

export interface SetPaymentTypeRequest {
  type: 'manual' | 'stripe';
  country_id: number;
}

export interface ManualAccountRequest {
  account_name: string;
  iban: string;
}

export interface StripeAccountResponse {
  data: {
    stripe_account_link: {
      url: string;
    };
  };
}

export interface StripeCompleteResponse {
  data: {
    success: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private stripeCountriesApiUrl = 'https://api.knoldg.com/api/account/insighter/payment/account/stripe/onboarding/countries';
  private setPaymentTypeApiUrl = 'https://api.knoldg.com/api/account/insighter/payment/account/type';
  private manualAccountApiUrl = 'https://api.knoldg.com/api/account/insighter/payment/account/manual';
  private stripeCreateApiUrl = 'https://api.knoldg.com/api/account/insighter/payment/account/stripe/onboarding/create';
  private stripeCompleteApiUrl = 'https://api.knoldg.com/api/account/insighter/payment/account/stripe/onboarding/complete';
  private stripeLinkApiUrl = 'https://api.knoldg.com/api/account/insighter/payment/account/stripe/onboarding/link';
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();
  currentLang: string = 'en';
  private authLocalStorageKey = 'foresighta-creds';

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) {
    this.translationService.onLanguageChange().subscribe(lang => {
      this.currentLang = lang || 'en';
    });
  }

  private setLoading(loading: boolean) {
    this.isLoadingSubject.next(loading);
  }

  private handleError(error: any) {
    return throwError(() => error);
  }

  private getAuthToken(): string | null {
    try {
      const authData = localStorage.getItem(this.authLocalStorageKey);
      if (authData) {
        const parsedData = JSON.parse(authData);
        return parsedData.authToken || null;
      }
    } catch (error) {
      console.error('Error parsing auth data from localStorage:', error);
    }
    return null;
  }

  private getHeaders(): HttpHeaders {
    const token = this.getAuthToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Language': this.currentLang,
      'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });
  }

  getStripeCountries(): Observable<StripeCountry[]> {
    this.setLoading(true);
    return this.http.get<any>(this.stripeCountriesApiUrl, { headers: this.getHeaders() }).pipe(
      map(res => res.data),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  setPaymentType(request: SetPaymentTypeRequest): Observable<any> {
    this.setLoading(true);
    return this.http.post<any>(this.setPaymentTypeApiUrl, request, { headers: this.getHeaders() }).pipe(
      map(res => res),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  createManualAccount(request: ManualAccountRequest): Observable<any> {
    this.setLoading(true);
    return this.http.post<any>(this.manualAccountApiUrl, request, { headers: this.getHeaders() }).pipe(
      map(res => res),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  createStripeAccount(): Observable<StripeAccountResponse> {
    this.setLoading(true);
    return this.http.post<StripeAccountResponse>(this.stripeCreateApiUrl, {}, { headers: this.getHeaders() }).pipe(
      map(res => res),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  completeStripeOnboarding(): Observable<StripeCompleteResponse> {
    this.setLoading(true);
    return this.http.post<StripeCompleteResponse>(this.stripeCompleteApiUrl, {}, { headers: this.getHeaders() }).pipe(
      map(res => res),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  getStripeLink(): Observable<StripeAccountResponse> {
    this.setLoading(true);
    return this.http.post<StripeAccountResponse>(this.stripeLinkApiUrl, {}, { headers: this.getHeaders() }).pipe(
      map(res => res),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }
}