import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError, map, catchError, finalize } from 'rxjs';
import { TranslationService } from 'src/app/modules/i18n';

export interface Meeting {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: 'approved' | 'pending' | 'postponed';
  title: string;
  description: string;
  client: {
    name: string;
    first_name: string;
    last_name: string;
    email: string;
    profile_photo_url: string | null;
    country: string | null;
  };
}

export interface MeetingResponse {
  data: Meeting[];
  links: {
    first: string;
    last: string;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MeetingsService {
  private apiUrl = 'https://api.knoldg.com/api/insighter/meeting/list';
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();
  currentLang: string = 'en';

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) {
    this.currentLang = this.translationService.getSelectedLanguage();
    this.translationService.onLanguageChange().subscribe((lang) => {
      this.currentLang = lang || 'en';
    });
  }

  private setLoading(loading: boolean) {
    this.isLoadingSubject.next(loading);
  }

  private handleError(error: any) {
    console.error('API Error:', error);
    return throwError(error);
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': this.currentLang
    });
  }

  getMeetings(page: number = 1, perPage: number = 10): Observable<MeetingResponse> {
    const headers = this.getHeaders();
    
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    this.setLoading(true);
    return this.http.get<MeetingResponse>(this.apiUrl, { headers, params }).pipe(
      map(response => response),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  // Update meeting status (approve/postpone)
  updateMeetingStatus(meetingId: number, status: 'approved' | 'postponed', notes: string): Observable<any> {
    const url = `https://api.knoldg.com/api/insighter/meeting/action/${meetingId}`;
    const headers = this.getHeaders();
    
    const body = {
      status: status,
      notes: notes
    };

    this.setLoading(true);
    return this.http.put(url, body, { headers }).pipe(
      map(response => response),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  // Helper method to get initials from name
  getInitials(firstName: string, lastName: string): string {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last;
  }
} 