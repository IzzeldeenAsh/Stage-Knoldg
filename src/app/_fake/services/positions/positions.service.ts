import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; 
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { TranslationService } from 'src/app/modules/i18n/translation.service';

export interface Position {
  id: number;
  name: string;
  names: {
    en: string;
    ar: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PositionsService {
  private apiUrl = 'https://api.4sighta.com/api/common/setting/position/list';
  private createApi = 'https://api.4sighta.com/api/admin/setting/position';
  private updateDeleteApi = 'https://api.4sighta.com/api/admin/setting/position';
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();
  currentLang: string = 'en';

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) {
    this.translationService.onLanguageChange().subscribe(lang => {
      this.currentLang = lang || 'en';;
    });
  }

  private setLoading(loading: boolean) {
    this.isLoadingSubject.next(loading);
  }

  private handleError(error: any) {
    return throwError(error);
  }

  getPositions(): Observable<Position[]> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': this.currentLang
    });

    this.setLoading(true);
    return this.http.get<any>(this.apiUrl, { headers }).pipe(
      map(res => res.data),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  createPosition(position: any): Observable<any> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': this.currentLang
    });

    this.setLoading(true);
    return this.http.post<any>(this.createApi, position, { headers }).pipe(
      map(res => res),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  updatePosition(positionId: number, updatedData: any): Observable<Position> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': this.currentLang
    });

    this.setLoading(true);
    return this.http.put<Position>(`${this.updateDeleteApi}/${positionId}`, updatedData, { headers }).pipe(
      map(res => res),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  deletePosition(positionId: number): Observable<any> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': this.currentLang
    });

    this.setLoading(true);
    return this.http.delete<any>(`${this.updateDeleteApi}/${positionId}`, { headers }).pipe(
      map(res => res),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }
}
