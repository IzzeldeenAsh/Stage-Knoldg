import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { map, catchError } from "rxjs/operators";
import { TranslationService } from "src/app/modules/i18n";

export interface WalletBalanceResponse {
  data: {
    balance: number;
  };
}

@Injectable({
  providedIn: "root",
})
export class WalletService {
  private readonly API_URL = "https://api.knoldg.com/api/account/wallet/balance";
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
    });

    return this.http.get<WalletBalanceResponse>(this.API_URL, { headers }).pipe(
      catchError((err) => {
        console.error("Error fetching wallet balance:", err);
        return throwError(err);
      })
    );
  }

  getBalance(): Observable<number> {
    return this.getWalletBalance().pipe(
      map((response) => response.data.balance)
    );
  }
}