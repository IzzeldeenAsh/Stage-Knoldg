import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { TranslationService } from "src/app/modules/i18n";

export interface WalletBalanceResponse {
  data: {
    balance: number;
  };
}

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
  description?: string;
}

export interface SubOrder {
  knowledge?: Knowledge[];
  knowledge_documents?: KnowledgeDocument[][];
  meeting_booking?: MeetingBooking;
}

export interface User {
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  profile_photo_url?: string | null;
  country_id: number;
  roles: string[];
}

export interface Order {
  uuid: string;
  user?: User;
  service: string;
  status: string;
  date: string;
  order_no: string;
  invoice_no: string;
  sub_orders?: SubOrder[];
  suborders?: SubOrder[];
}

export interface Transaction {
  transaction: 'deposit' | 'withdraw';
  amount: number;
  date: string;
  type: string;
  order: Order;
}

export interface TransactionMeta {
  current_page: number;
  from: number;
  last_page: number;
  path: string;
  per_page: number;
  to: number;
  total: number;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
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
  providedIn: "root",
})
export class WalletService {
  private readonly BASE_URL = "https://api.foresighta.co/api/account/wallet";
  currentLang: string = "";

  constructor(
    private http: HttpClient,
    private translateService: TranslationService
  ) {
    this.currentLang = this.translateService.getSelectedLanguage()
      ? this.translateService.getSelectedLanguage()
      : "en";
  }

  getWalletBalance(): Observable<WalletBalanceResponse> {
    const headers = new HttpHeaders({
      Accept: "application/json",
      "Accept-Language": this.currentLang,
      "X-Timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    return this.http.get<WalletBalanceResponse>(`${this.BASE_URL}/balance`, { headers }).pipe(
      catchError((err) => {
        console.error("Error fetching wallet balance:", err);
        return throwError(() => err);
      })
    );
  }

  getBalance(): Observable<number> {
    return this.getWalletBalance().pipe(
      map((response) => response.data.balance)
    );
  }

  getTransactions(page: number = 1, perPage: number = 10): Observable<TransactionResponse> {
    const headers = new HttpHeaders({
      Accept: "application/json",
      "Accept-Language": this.currentLang,
      "X-Timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    const params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    return this.http.get<TransactionResponse>(`${this.BASE_URL}/transaction`, { headers, params }).pipe(
      catchError((err) => {
        console.error("Error fetching transactions:", err);
        return throwError(() => err);
      })
    );
  }
}