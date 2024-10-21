import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; 
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class HSCodeService {
  private apiUrl = 'https://myinsighta.com/api/hs-code';
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  private setLoading(loading: boolean) {
    this.isLoadingSubject.next(loading);
  }

  private handleError(error: any) {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Could not get HS codes; please try again later.'));
  }

  getHSCodes(lang: string = 'en'): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'lang': lang
    });

    this.setLoading(true);
    return this.http.get<any>(this.apiUrl, { headers }).pipe(
      map(res => res),
      catchError(this.handleError),
      finalize(() => this.setLoading(false))
    );
  }

  getHScodeByISIC(isicCode:string):Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'lang': 'en'
    });

    this.setLoading(true);
    return this.http.get<any>(`https://myinsighta.com/api/get-hs-code-by-isic/${isicCode}`, { headers }).pipe(
      map(res => res),
      catchError(this.handleError),
      finalize(() => this.setLoading(false))
    );

  }
}