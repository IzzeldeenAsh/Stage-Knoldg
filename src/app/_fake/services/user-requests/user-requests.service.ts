import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, finalize, map, throwError } from 'rxjs';
import { TranslationService } from 'src/app/modules/i18n';
// models/type.model.ts
export interface Type {
    key: string;
    label: string;
  }
  
  // models/requestable.model.ts
  export interface Requestable {
    id: number;
    legal_name: string;
    website: string | null;
    verified_email: string | null;
    about_us: string;
    register_document: string;
    logo: string;
    status: string;
    verified: boolean;
    address: string;
    company_phone: string;
    first_name?: string;
    last_name?: string;
    roles?: string[];
  }
  
  // models/data-item.model.ts
  export interface UserRequest {
    id: number;
    type: Type;
    requestable_type: string;
    comments: string;
    staff_notes: string | null;
    handel_by: string | null; // Consider renaming to 'handled_by' for clarity
    handel_at: string | null; // Consider renaming to 'handled_at' for clarity
    status: string;
    requestable: Requestable;
    final_status: string;
    children: UserRequest[];
  }
  


@Injectable({
  providedIn: 'root'
})
export class UserRequestsService {
  private apiUrl = 'https://api.knoldg.com/api/account/request';
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();
  currentLang: string = 'en';
  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) {
    this.currentLang = this.translationService.getSelectedLanguage();
  }

  private setLoading(loading: boolean) {
    this.isLoadingSubject.next(loading);
  }

  private handleError(error: any) {
    return throwError(() => error);
  }

  /**
   * Fetch all user requests.
   * @returns Observable of UserRequest array
   */
  getAllUserRequests(lang:string): Observable<UserRequest[]> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': lang
    });

    this.setLoading(true);
    return this.http.get<any>(this.apiUrl, { headers }).pipe(
      map(response => response.data),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  /**
   * Send activation request for a company
   * @param comments User comments for the request
   * @param parentId Parent company ID
   * @returns Observable of the request response
   */
  sendActivationRequest(comments: string, parentId: string): Observable<any> {
    const url = 'https://api.knoldg.com/api/company/request/activate';
    const formData = new FormData();
    formData.append('comments', comments);
    formData.append('parent_id', parentId);

    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Accept-Language': this.currentLang
    });

    this.setLoading(true);
    return this.http.post(url, formData, { headers }).pipe(
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  /**
   * Send verification request for a company
   * @param comments User comments for the request
   * @param parentId Parent company ID
   * @returns Observable of the request response
   */
  sendVerificationRequest(comments: string, parentId: string): Observable<any> {
    const url = 'https://api.knoldg.com/api/company/request/verified';
    const formData = new FormData();
    formData.append('comments', comments);
    formData.append('parent_id', parentId);

    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Accept-Language': this.currentLang
    });

    this.setLoading(true);
    return this.http.post(url, formData, { headers }).pipe(
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  /**
   * Send deactivate and delete request for a company
   * @param comments User comments for the request 
   * @param parentId Parent company ID
   * @returns Observable of the request response
   */
  sendDeactivateAndDeleteRequest(comments: string, parentId: string): Observable<any> {
    const url = 'https://api.knoldg.com/api/company/request/deactivate-delete';
    const formData = new FormData();
    formData.append('comments', comments);
    formData.append('parent_id', parentId);

    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Accept-Language': this.currentLang
    });

    this.setLoading(true);
    return this.http.post(url, formData, { headers }).pipe(
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  /**
   * Send deactivate and delete request for an insighter
   * @param comments User comments for the request 
   * @param parentId Parent insighter ID
   * @returns Observable of the request response
   */
  sendDeactivateAndDeleteRequestInsighter(comments: string, parentId: string): Observable<any> {
    const url = 'https://api.knoldg.com/api/insighter/request/deactivate-delete';
    const formData = new FormData();
    formData.append('comments', comments);
    formData.append('parent_id', parentId);

    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Accept-Language': this.currentLang
    });

    this.setLoading(true);
    return this.http.post(url, formData, { headers }).pipe(
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  };

  /**
   * Send reactivate request for a company
   * @param comments User comments for the request 
   * @param parentId Parent company ID
   * @returns Observable of the request response
   */
  sendReactivateRequest(type:string): Observable<any> {
    const url = type === 'company' ? 'https://api.knoldg.com/api/company/activate' : 'https://api.knoldg.com/api/insighter/activate';
    
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Accept-Language': this.currentLang
    });

    this.setLoading(true);
    return this.http.post(url, {}, { headers }).pipe(
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }
}
