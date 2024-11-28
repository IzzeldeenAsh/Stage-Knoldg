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
  private apiUrl =
    'https://api.foresighta.co/api/common/setting/guideline/list';
  private createUpdateApi =
    'https://api.foresighta.co/api/admin/setting/guideline';
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> =
    this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  private setLoading(loading: boolean) {
    this.isLoadingSubject.next(loading);
  }

  private handleError(error: any) {
    return throwError(error);
  }

  getGuidelines(): Observable<Guideline[]> {
    this.setLoading(true);
    return this.http.get<GuidelineResponse>(this.apiUrl).pipe(
      finalize(() => this.setLoading(false)),
      catchError(this.handleError),
      map((res) => res.data)
    );
  }

  createOrUpdateGuideline(guidelineData: FormData, id?: number): Observable<any> {
    const apiUrl = id
      ? `${this.createUpdateApi}/${id}`
      : this.createUpdateApi;
    this.setLoading(true);
    return this.http.post(apiUrl, guidelineData).pipe(
      finalize(() => this.setLoading(false)),
      catchError(this.handleError)
    );
  }

  deleteGuideline(id: number): Observable<any> {
    const apiUrl = `${this.createUpdateApi}/${id}`;
    this.setLoading(true);
    return this.http.delete(apiUrl).pipe(
      finalize(() => this.setLoading(false)),
      catchError(this.handleError)
    );
  }
}
