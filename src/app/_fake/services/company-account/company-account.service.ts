import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { TranslationService } from 'src/app/modules/i18n/translation.service';
import { map, catchError, finalize } from 'rxjs/operators';

export interface AccountExistResponse {
  data?: {
    name: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  message?: string;
  errors?: {
    common?: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class CompanyAccountService {
  private insightaHost = 'https://api.foresighta.co';
  private accountExistApi = `${this.insightaHost}/api/company/account/exist`;
  private inviteInsighterApi = `${this.insightaHost}/api/company/insighter`;

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

  private handleError(error: any) {
    return throwError(error);
  }

  // Check if an account exists
  checkAccountExist(email: string): Observable<AccountExistResponse> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': this.currentLang
    });

    this.setLoading(true);
    return this.http.post<AccountExistResponse>(this.accountExistApi, { email }, { headers }).pipe(
      map(res => res),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  // Invite insighter
  inviteInsighter(data: {
    email: string;
    first_name: string;
    last_name: string;
    industries: string[];
    consulting_field: string[];
  }): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Accept-Language': this.currentLang
    });

    const formData = new FormData();
    formData.append('email', data.email);
    formData.append('first_name', data.first_name);
    formData.append('last_name', data.last_name);
    
    // Add industries as array
    if (data.industries && data.industries.length > 0) {
      data.industries.forEach(industry => {
        formData.append('industries[]', industry);
      });
    }
    
    // Add consulting fields as array
    if (data.consulting_field && data.consulting_field.length > 0) {
      data.consulting_field.forEach(field => {
        formData.append('consulting_field[]', field);
      });
    }

    this.setLoading(true);
    return this.http.post(this.inviteInsighterApi, formData, { headers }).pipe(
      map(res => res),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }
}
