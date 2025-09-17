import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { TranslationService } from 'src/app/modules/i18n/translation.service';

export interface InsighterWallet {
  id: number;
  uuid: string;
  name: string;
  email: string;
  country: string;
  phone: string;
  profile_photo_url: string | null;
  balance: string;
  payment_type: string;
  company?: {
    uuid: string;
    legal_name: string;
    logo: string;
    verified: boolean;
  };
}

export interface Transaction {
  transaction: 'deposit' | 'withdraw';
  amount: number;
  date: string;
  type: string;
  order: {
    uuid: string;
    user: {
      name: string;
      first_name: string;
      last_name: string;
      email: string;
      profile_photo_url: string | null;
      country_id: number | null;
      roles: string[];
    };
    service: string;
    status: string;
    date: string;
    order_no: string;
    invoice_no: string;
    sub_orders: any[];
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    links: any[];
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class FundService {
  private baseUrl = 'https://api.foresighta.co/api/admin/fund';
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();
  currentLang: string = 'en';

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

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Accept-Language': this.currentLang,
      'X-Timezone': Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  }

  private handleError(error: any) {
    return throwError(error);
  }

  getInsighterWallets(page: number = 1): Observable<PaginatedResponse<InsighterWallet>> {
    const headers = this.getHeaders();
    this.setLoading(true);

    return this.http.get<PaginatedResponse<InsighterWallet>>(`${this.baseUrl}/insighter?page=${page}`, { headers }).pipe(
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  getInsighterTransactions(insighterId: number, page: number = 1): Observable<PaginatedResponse<Transaction>> {
    const headers = this.getHeaders();
    this.setLoading(true);

    return this.http.get<PaginatedResponse<Transaction>>(`${this.baseUrl}/insighter/transaction/${insighterId}?page=${page}`, { headers }).pipe(
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }
}