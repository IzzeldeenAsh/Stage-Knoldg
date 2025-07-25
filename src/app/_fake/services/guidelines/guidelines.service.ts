// guidelines.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  catchError,
  finalize,
  throwError,
  map,
} from 'rxjs';

export interface Guideline {
  id: number;
  name: string;
  names: {
    en: string;
    ar: string;
  };
  guideline: string;
  guidelines: {
    en: string;
    ar: string;
  };
  slug: string;
  version: string;
  file?: {
    en: File | null;
    ar: File | null;
  };
}

export interface GuidelineResponse {
  data: Guideline[];
}

@Injectable({
  providedIn: 'root',
})
export class GuidelinesService {
  private apiUrl = 'https://api.knoldg.comm/api/common/setting/guideline/list';
  private createUpdateApi = 'https://api.knoldg.comm/api/admin/setting/guideline';
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  private setLoading(loading: boolean): void {
    this.isLoadingSubject.next(loading);
  }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    return throwError(() => new Error('Something went wrong; please try again later.'));
  }

  getGuidelines(): Observable<Guideline[]> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Accept-Language': 'en'
    });
    this.setLoading(true);
    return this.http.get<GuidelineResponse>(this.apiUrl, { headers }).pipe(
      map((res) => res.data),
      catchError(this.handleError),
      finalize(() => this.setLoading(false))
    );
  }

  createOrUpdateGuideline(guidelineData: FormData, id?: number): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Accept-Language': 'en'
    });
    const apiUrl = id ? `${this.createUpdateApi}/${id}` : this.createUpdateApi;
    this.setLoading(true);
    return this.http.post(apiUrl, guidelineData, { headers }).pipe(
      catchError(this.handleError),
      finalize(() => this.setLoading(false))
    );
  }

  deleteGuideline(id: number): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Accept-Language': 'en'
    });
    const apiUrl = `${this.createUpdateApi}/${id}`;
    this.setLoading(true);
    return this.http.delete(apiUrl, { headers }).pipe(
      catchError(this.handleError),
      finalize(() => this.setLoading(false))
    );
  }
}
