import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TranslationService } from '../../../modules/i18n';

export interface KnowledgeDocument {
  file_name: string;
  file_extension: string;
  price: number;
}

export interface Knowledge {
  type: string;
  title: string;
}

export interface MeetingBooking {
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  title: string;
  description: string;
}

export interface Suborder {
  knowledge?: Knowledge[];
  knowledge_documents?: KnowledgeDocument[][];
  meeting_booking?: MeetingBooking;
}

export interface User {
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_photo_url: string | null;
  country_id: number;
  roles: string[];
}

export interface Order {
  uuid: string;
  user: User;
  service: string;
  status: string;
  date: string;
  order_no: string;
  invoice_no: string;
  orderable: Suborder;
}

export interface Company {
  uuid: string;
  legal_name: string;
  logo: string;
  verified: boolean;
}

export interface Insighter {
  uuid: string;
  name: string;
  profile_photo_url: string | null;
  roles: string[];
  company: Company | null;
}

export interface Transaction {
  transaction: string;
  amount: number;
  date: string;
  type: string;
  order: Order;
  insighter?: Insighter;
}

export interface TransactionLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface TransactionMeta {
  current_page: number;
  from: number;
  last_page: number;
  links: TransactionLink[];
  path: string;
  per_page: number;
  to: number;
  total: number;
}

export interface TransactionResponse {
  data: Transaction[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: TransactionMeta;
}

export interface PlatformBalanceResponse {
  data: {
    balance: number;
  };
}

export interface PlatformTransactionListResponse {
  data: Transaction[];
}

export interface ChartDataPoint {
  date: string;
  deposits: number;
  withdrawals: number;
  balance: number;
}

@Injectable({
  providedIn: 'root'
})
export class TransactionsService {
  private apiUrl = `${environment.apiBaseUrl}/admin/fund/platform/transaction`;
  private balanceApiUrl = `${environment.apiBaseUrl}/admin/fund/platform/balance`;
  private listApiUrl = `${environment.apiBaseUrl}/admin/fund/platform/transaction/list`;
  private authLocalStorageKey = 'foresighta-creds';
  private currentLang = 'en';

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) {
    this.currentLang = this.translationService.getSelectedLanguage() || 'en';
    this.translationService.onLanguageChange().subscribe((lang: string) => {
      this.currentLang = lang || 'en';
    });
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

  getTransactions(page: number = 1, perPage: number = 10, perTime?: 'weekly' | 'monthly' | 'yearly'): Observable<TransactionResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (perTime) {
      params = params.set('per_time', perTime);
    }

    const headers = this.getHeaders();

    return this.http.get<TransactionResponse>(this.apiUrl, { params, headers });
  }

  getPlatformBalance(): Observable<PlatformBalanceResponse> {
    const headers = this.getHeaders();
    return this.http.get<PlatformBalanceResponse>(this.balanceApiUrl, { headers });
  }

  getAllPlatformTransactions(perTime?: 'weekly' | 'monthly' | 'yearly'): Observable<PlatformTransactionListResponse> {
    let params = new HttpParams();

    if (perTime) {
      params = params.set('per_time', perTime);
    }

    const headers = this.getHeaders();
    return this.http.get<PlatformTransactionListResponse>(this.listApiUrl, { params, headers });
  }
}