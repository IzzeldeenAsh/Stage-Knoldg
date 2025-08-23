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
  type: 'manual' | 'provider';
  country_id: number;
  accept_terms:boolean
}

export interface ManualAccountRequest {
  account_name: string;
  iban: string;
  address: string;
  swift_code: string;
  phone: string;
  code: string;
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
export interface StripeAccountDetailsResponse {
  data: {
    primary: {
      type: string;
      status: string;
      country: {
        id: number;
        name: string;
        flag: string;
      };
      account_name?: string;
      swift_code?: string;
      iban?: string;
      address?: string;
      phone?: string | null;
      stripe_account?: boolean;
      details_submitted_at?: string | null;
      charges_enable_at?: string | null;
    };
    secondary: {
      type: string;
      stripe_account?: boolean;
      details_submitted_at?: string | null;
      charges_enable_at?: string | null;
      status: string;
      account_name?: string;
      swift_code?: string;
      iban?: string;
      address?: string;
      phone?: string | null;
      country?: {
        id: number;
        name: string;
        flag: string;
      };
    };
  };
}

export interface StripeOnboardingStatusResponse {
  data: {
    account: boolean;
    details_submitted_at: string | null;
    charges_enable_at: string | null;
    [key: string]: boolean | string | null;
  };
}

export interface AccountDetailsResponse {
  data: {
    primary: {
      type: string;
      status: string;
      country: {
        id: number;
        name: string;
        flag: string;
      };
      account_name?: string;
      swift_code?: string;
      iban?: string;
      address?: string;
      phone?: string | null;
      stripe_account?: boolean;
      details_submitted_at?: string | null;
      charges_enable_at?: string | null;
    };
    secondary: {
      type: string;
      stripe_account?: boolean;
      details_submitted_at?: string | null;
      charges_enable_at?: string | null;
      status: string;
      account_name?: string;
      swift_code?: string;
      iban?: string;
      address?: string;
      phone?: string | null;
      country?: {
        id: number;
        name: string;
        flag: string;
      };
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private stripeCountriesApiUrl = 'https://api.knoldg.com/api/insighter/payment/account/stripe/onboarding/countries';
  private setPaymentTypeApiUrl = 'https://api.knoldg.com/api/insighter/payment/account/type';
  private manualAccountApiUrl = 'https://api.knoldg.com/api/insighter/payment/account/manual';
  private stripeCreateApiUrl = 'https://api.knoldg.com/api/insighter/payment/account/stripe/onboarding/create';
  private stripeCompleteApiUrl = 'https://api.knoldg.com/api/insighter/payment/account/stripe/onboarding/complete';
  private stripeLinkApiUrl = 'https://api.knoldg.com/api/insighter/payment/account/stripe/onboarding/link';
  private stripeStatusApiUrl = 'https://api.knoldg.com/api/insighter/payment/account/stripe/onboarding/status';
  private accountDetailsApiUrl = 'https://api.knoldg.com/api/insighter/payment/account/details';
  private resendOtpApiUrl = 'https://api.knoldg.com/api/insighter/payment/account/otp/resend';
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

  createStripeAccount(code?: string): Observable<StripeAccountResponse> {
    this.setLoading(true);
    const body = code ? { code } : {};
    return this.http.post<StripeAccountResponse>(this.stripeCreateApiUrl, body, { headers: this.getHeaders() }).pipe(
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

  getStripeLink(code: string): Observable<StripeAccountResponse> {
    this.setLoading(true);
    const body = { code };
    return this.http.post<StripeAccountResponse>(this.stripeLinkApiUrl, body, { headers: this.getHeaders() }).pipe(
      map(res => res),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  checkStripeOnboardingStatus(): Observable<StripeOnboardingStatusResponse> {
    this.setLoading(true);
    return this.http.get<StripeOnboardingStatusResponse>(this.stripeStatusApiUrl, { headers: this.getHeaders() }).pipe(
      map(res => res),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  getAccountDetails(): Observable<AccountDetailsResponse> {
    this.setLoading(true);
    return this.http.get<AccountDetailsResponse>(this.accountDetailsApiUrl, { headers: this.getHeaders() }).pipe(
      map(res => res),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  getStripeAccountDetails(): Observable<AccountDetailsResponse> {
    return this.getAccountDetails();
  }

  getManualAccountDetails(): Observable<AccountDetailsResponse> {
    return this.getAccountDetails();
  }

  resendOtp(): Observable<any> {
    this.setLoading(true);
    return this.http.post<any>(this.resendOtpApiUrl, {}, { headers: this.getHeaders() }).pipe(
      map(res => res),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }
}