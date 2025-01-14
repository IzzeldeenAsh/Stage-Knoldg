import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { TranslationService } from 'src/app/modules/i18n';

export interface Tag {
  id: number;
  name: string;
}

export interface Topic {
  id: number;
  name: string;
}

export interface Industry {
  id: number;
  name: string;
}

export interface Knowledge {
  id: number;
  type: string;
  title: string;
  slug: string;
  description: string;
  keywords: string[];
  tags: Tag[];
  topic: Topic;
  industry: Industry;
  isic_code: any[]; // You might want to create a specific interface if there's a known structure
  hs_code: any; // You might want to specify the type if there's a known structure
  language: string;
  status: string;
}

export interface KnowledgeResponse {
  data: Knowledge;
}

export interface PaginatedKnowledgeResponse {
  data: Knowledge[];
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
    links: {
      url: string | null;
      label: string;
      active: boolean;
    }[];
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class KnowledgeService {
  private baseUrl = 'https://api.foresighta.co';
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
    return throwError(error);
  }

  getKnowledgeById(id: number): Observable<KnowledgeResponse> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': this.currentLang,
    });

    this.setLoading(true);
    return this.http.get<KnowledgeResponse>(
      `${this.baseUrl}/api/insighter/library/knowledge/${id}`,
      { headers }
    ).pipe(
      map((res) => res),
      catchError((error) => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  getPaginatedKnowledges(page: number = 1): Observable<PaginatedKnowledgeResponse> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': this.currentLang,
    });

    this.setLoading(true);
    return this.http.get<PaginatedKnowledgeResponse>(
      `${this.baseUrl}/api/insighter/library/knowledge?page=${page}`,
      { headers }
    ).pipe(
      map((res) => res),
      catchError((error) => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }
}
