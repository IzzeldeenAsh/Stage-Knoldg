import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, finalize, map, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TranslationService } from 'src/app/modules/i18n';

export interface AgreementCheckResponse {
  data: {
    accept: boolean;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AgreementService {
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();
  private currentLang: string = 'en';

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) {
    this.translationService.onLanguageChange().subscribe((lang) => {
      this.currentLang = lang || 'en';
    });
  }

  private setLoading(loading: boolean) {
    this.isLoadingSubject.next(loading);
  }

  private handleError(error: any) {
    console.error('Agreement API Error:', error);
    return throwError(() => error);
  }

  checkLatestAgreement(): Observable<boolean> {
    const url = `${environment.apiBaseUrl}/account/agreement/check`;
    const headers = new HttpHeaders({
      Accept: 'application/json',
      'Accept-Language': this.currentLang,
    });
    this.setLoading(true);
    return this.http.get<AgreementCheckResponse>(url, { headers }).pipe(
      map((res) => !!res?.data?.accept),
      catchError((error) => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }
}

