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

export interface Suborder {
  knowledge: Knowledge[];
  knowledge_documents: KnowledgeDocument[][];
}

export interface Order {
  sub_orders: Suborder[];
}

export interface Transaction {
  transaction: string;
  amount: number;
  date: string;
  type: string;
  order?: Order;
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

@Injectable({
  providedIn: 'root'
})
export class TransactionsService {
  private apiUrl = `${environment.apiBaseUrl}/admin/fund/transaction`;
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

  getTransactions(page: number = 1, perPage: number = 10): Observable<TransactionResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    const headers = this.getHeaders();

    return this.http.get<TransactionResponse>(this.apiUrl, { params, headers });
  }
}