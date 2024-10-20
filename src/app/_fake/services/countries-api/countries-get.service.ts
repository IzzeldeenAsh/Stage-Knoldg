import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, finalize, map, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CountryService {
  private apiUrl = 'https://myinsighta.com/api/country'; // Replace this with your actual API URL
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();
  constructor(private http: HttpClient) {}

  private setLoading(loading: boolean) {
    this.isLoadingSubject.next(loading);
  }

  private handleError(error: any) {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Could not get countires list; please try again later.'));
  }

  getCountries(lang: string = 'ar'): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'lang': lang
    });

    return this.http.get<any>(this.apiUrl, { headers }).pipe(
      map(res=>{
        return res
      }),
      catchError(this.handleError),
      finalize(() => this.setLoading(false))
    );
  }
}