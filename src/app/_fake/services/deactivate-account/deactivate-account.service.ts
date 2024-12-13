import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, finalize, map, throwError } from 'rxjs';
import { TranslationService } from 'src/app/modules/i18n/translation.service';

@Injectable({
  providedIn: 'root'
})
export class DeactivateAccountService {
  private deactivateApiUrl = 'https://api.foresighta.co/api/company/request/deactivate'; // New API URL
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();
  currentLang: string = "en";

  constructor(
    private http: HttpClient,
  ) {
  
  }

  private setLoading(loading: boolean) {
    this.isLoadingSubject.next(loading);
  }

  private handleError(error: any) {
    // You can enhance error handling here, e.g., logging
    return throwError(() => error);
  }

  /**
   * Deactivate Account Request
   * @param comments - User comments for deactivation
   * @param lang - Current language
   * @returns Observable<any>
   */
  deactivateRequest(comments: string, lang: string): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Accept-Language': lang
    });

    const formData = new FormData();
    formData.append('comments', comments);

    this.setLoading(true);
    return this.http.post<any>(this.deactivateApiUrl, formData, { headers }).pipe(
      map((res) => res),
      catchError((error) => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }
}
