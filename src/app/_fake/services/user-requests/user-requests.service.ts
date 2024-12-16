import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, finalize, map, throwError } from 'rxjs';
import { TranslationService } from 'src/app/modules/i18n/translation.service';

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
  }
  


@Injectable({
  providedIn: 'root'
})
export class UserRequestsService {
  private apiUrl = 'https://api.foresighta.co/api/account/request';
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();

  constructor(
    private http: HttpClient,
  ) {
 
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
}
