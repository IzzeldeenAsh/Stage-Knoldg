import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

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

export interface Payment {
  method: string;
  provider: string | null;
  amount: number;
  currency: string;
  status: string;
  confirmed_at: string;
}

export interface FulfillmentUser {
  id: number;
  name: string;
  email: string;
  profile_photo_url: string | null;
}

export interface FulfillmentAttempt {
  user: FulfillmentUser;
  step: string;
  status: string;
  retry_count: number;
  error_message: string | null;
  attempted_at: string;
}

export interface Order {
  uuid: string;
  amount: number;
  service: string;
  currency: string;
  date: string;
  order_no: string;
  invoice_no: string;
  suborders: Suborder[];
  status: string;
  payment: Payment;
  fulfillment_staus: string;
  fulfillment_attempts: FulfillmentAttempt[];
}

export interface OrderLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface OrderMeta {
  current_page: number;
  from: number;
  last_page: number;
  links: OrderLink[];
  path: string;
  per_page: number;
  to: number;
  total: number;
}

export interface OrderResponse {
  data: Order[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: OrderMeta;
}

@Injectable({
  providedIn: 'root'
})
export class AdminOrdersService {
  private apiUrl = `${environment.apiBaseUrl}/admin/order/knowledge`;
  private authLocalStorageKey = 'foresighta-creds';

  constructor(private http: HttpClient) { }

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
      'Accept-Language': 'en',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });
  }

  getOrders(page: number = 1, perPage: number = 10): Observable<OrderResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());
    
    const headers = this.getHeaders();
    
    return this.http.get<OrderResponse>(this.apiUrl, { params, headers });
  }
}