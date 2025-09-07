import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, finalize, map, throwError } from 'rxjs';
import { TranslationService } from 'src/app/modules/i18n';

export interface KnowledgeDocument {
  file_name: string;
  file_extension: string;
  price: number;
}

export interface Knowledge {
  type: string;
  title: string;
}

export interface SubOrder {
  knowledge: Knowledge[];
  knowledge_documents: KnowledgeDocument[][];
}

export interface PaymentInfo {
  method: string;
  provider: string;
  confirmed_at: string;
}

export interface Order {
  uuid: string;
  service: string;
  status: string;
  amount: number;
  currency: string;
  date: string;
  order_no: string;
  invoice_no: string;
  payment: PaymentInfo;
  suborders: SubOrder[];
  knowledge_download_ids: string[];
}

export interface PaginationLinks {
  first: string;
  last: string;
  prev: string | null;
  next: string | null;
}

export interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  path: string;
  per_page: number;
  to: number;
  total: number;
}

export interface OrdersResponse {
  data: Order[];
  links: PaginationLinks;
  meta: PaginationMeta;
}

@Injectable({
  providedIn: 'root'
})
export class MyOrdersService {
  private readonly API_URL = 'https://api.foresighta.co/api/account/order/knowledge';
  
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();
  private currentLang: string = 'en';

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) {
    this.currentLang = this.normalizeLanguage(this.translationService.getSelectedLanguage() || 'en');
    this.translationService.onLanguageChange().subscribe((lang) => {
      this.currentLang = this.normalizeLanguage(lang || 'en');
    });
  }

  private normalizeLanguage(lang: string): string {
    if (!lang) return 'en';
    
    const normalizedLang = lang.toLowerCase().split(/[-_,;]/)[0];
    return normalizedLang === 'ar' ? 'ar' : 'en';
  }

  private setLoading(loading: boolean): void {
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

  private handleError(error: any): Observable<never> {
    console.error('MyOrdersService error:', error);
    return throwError(() => error);
  }

  getOrders(page: number = 1): Observable<OrdersResponse> {
    const url = `${this.API_URL}?page=${page}&per_page=5`;
    const headers = this.getHeaders();
    
    this.setLoading(true);
    return this.http.get<OrdersResponse>(url, { headers }).pipe(
      map((response) => response),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }
}