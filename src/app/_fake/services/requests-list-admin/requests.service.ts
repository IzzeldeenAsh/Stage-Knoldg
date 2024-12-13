import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, finalize, map, throwError } from 'rxjs';
import { TranslationService } from 'src/app/modules/i18n/translation.service';
import { RequestResponse } from 'src/app/modules/admin-dashboard/dashbord/dashboard/requests-list/request.interface';

@Injectable({
  providedIn: 'root'
})
export class RequestsService {
  private apiUrl = 'https://api.foresighta.co/api/admin/request'; // POST endpoint for requests
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();
  private currentLang: string = 'en';

  constructor(
    private http: HttpClient,
    private translationService: TranslationService,
  ) {
    this.translationService.onLanguageChange().subscribe(lang => {
      this.currentLang = lang || 'en';
    });
  }

  private setLoading(loading: boolean) {
    this.isLoadingSubject.next(loading);
  }

  private handleError(error: any) {
    return throwError(() => error);
  }

  /**
   * Fetch requests data via a POST request.
   * @param postData The request body payload to send to the endpoint (filters, pagination, etc.)
   * @returns Observable of RequestResponse
   */
  getRequests(): Observable<RequestResponse> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language':'en'
    });

    this.setLoading(true);
    return this.http.get<RequestResponse>(this.apiUrl, { headers }).pipe(
      map((response) => response),
      catchError((error) => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }
}
