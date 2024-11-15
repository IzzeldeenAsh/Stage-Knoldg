import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, finalize, map, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CheckCodeEmailService {
  private apiUrl = 'https://myinsighta.com/api/check-email-code';
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  private setLoading(loading: boolean) {
    this.isLoadingSubject.next(loading);
  }

  private handleError(error: any) {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Could not get verify email; please try again later.'));
  }
  resendEmailCode(email: string): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    });

    const url = `https://myinsighta.com/api/resend-code/${email}`;
    return this.http.get(url,{ headers });
  }

  checkEmailcode(email:string,code:string): Observable<any> {
    this.setLoading(true)
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    });

    return this.http.get<any>(`${this.apiUrl}/${email}/${code}`, { headers }).pipe(
      map(res => res),
      catchError(this.handleError),
      finalize(() => this.setLoading(false))
    );
  }
}

