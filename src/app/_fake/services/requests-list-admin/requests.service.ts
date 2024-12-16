import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, finalize, map, throwError } from 'rxjs';
import { TranslationService } from 'src/app/modules/i18n/translation.service';
import { RequestResponse } from 'src/app/modules/admin-dashboard/dashbord/dashboard/requests-list/request.interface';
export interface IVerificationQuestion {
  id: number;
  question: string;
  type: string;
}

export interface VerificationAnswer {
  verification_question_id: number;
  answer: string;
}

@Injectable({
  providedIn: 'root'
})
export class RequestsService {
  private apiUrl = 'https://api.foresighta.co/api/admin/request'; // POST endpoint for requests
  private verificationQuestionsUrl = 'https://api.foresighta.co/api/common/setting/verification-question/list';
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

  /**
   * Fetch verification questions list
   * @returns Observable of verification questions response
   */
  getListOfVerificationQuestions(): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': 'en'
    });

    this.setLoading(true);
    return this.http.get<any>(this.verificationQuestionsUrl, { headers }).pipe(
      map((response) => response),
      catchError((error) => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  /**
   * Activate or decline a company request
   * @param requestId The ID of the request to activate
   * @param staffNotes Staff notes about the activation
   * @param status The status to set ('approved' or 'decline')
   * @returns Observable of the activation response
   */
  activateCompanyRequest(requestId: number, staffNotes: string, status: 'approved' | 'decline'): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': 'en'
    });

    const url = `${this.apiUrl}/action/company/activate/${requestId}`;
    const body = {
      staff_notes: staffNotes,
      status: status
    };

    this.setLoading(true);
    return this.http.post<any>(url, body, { headers }).pipe(
      map((response) => response),
      catchError((error) => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  /**
   * Deactivate a company request
   * @param requestId The ID of the request to deactivate
   * @param staffNotes Staff notes about the deactivation
   * @returns Observable of the deactivation response
   */
  deactivateCompanyRequest(requestId: number, staffNotes: string): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': 'en'
    });

    const url = `${this.apiUrl}/action/company/deactivate/${requestId}`;
    const body = {
      staff_notes: staffNotes,
      status: 'approved'
    };

    this.setLoading(true);
    return this.http.post<any>(url, body, { headers }).pipe(
      map((response) => response),
      catchError((error) => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  /**
   * Verify a company request with verification answers
   * @param requestId The ID of the request to verify
   * @param verificationAnswers Array of verification answers
   * @param staffNotes Staff notes about the verification
   * @returns Observable of the verification response
   */
  verifyCompanyRequest(requestId: number, verificationAnswers: VerificationAnswer[], staffNotes: string, status: 'approved' | 'declined'): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': 'en'
    });

    const url = `${this.apiUrl}/action/company/verified/${requestId}`;
    const body = {
      verification_answers: verificationAnswers,
      staff_notes: staffNotes,
      status: status
    };

    this.setLoading(true);
    return this.http.post<any>(url, body, { headers }).pipe(
      map((response) => response),
      catchError((error) => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }
}
