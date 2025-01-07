import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { TranslationService } from 'src/app/modules/i18n';

export interface CreateKnowledgeRequest {
  type: string;
  title: string;
  description: string;
  topic_id: number;
  industry_id: number;
  isic_code_id?: number | null;
  hs_code_id?: number | null;
  language: string;
  region: number[];
  country: number[];
  economic_block: number[];
}

export interface CreateKnowledgeResponse {
  data: {
    knowledge_id: number;
  }
}

export interface SuggestTopicRequest {
  industry_id: number;
  name: {
    en: string;
    ar: string;
  }
}

export interface SuggestTopicResponse {
  data: {
    topic_id: number;
  }
}

@Injectable({
  providedIn: 'root'
})
export class AddInsightStepsService {
  private insightaHost = 'https://api.foresighta.co';
  private apiUrl = `${this.insightaHost}/api/insighter/library/knowledge`;
  private suggestTopicUrl = `${this.insightaHost}/api/insighter/topic/suggest`;
  
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();
  currentLang: string = 'en';

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) {
    this.currentLang = this.translationService.getSelectedLanguage();
    this.translationService.onLanguageChange().subscribe(lang => {
      this.currentLang = lang || 'en';
    });
  }

  private setLoading(loading: boolean) {
    this.isLoadingSubject.next(loading);
  }

  private handleError(error: any) {
    return throwError(error);
  }

  step2CreateKnowledge(request: CreateKnowledgeRequest): Observable<CreateKnowledgeResponse> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': this.currentLang
    });

    this.setLoading(true);
    return this.http.post<CreateKnowledgeResponse>(this.apiUrl, request, { headers }).pipe(
      map(res => res),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  createSuggestTopic(request: SuggestTopicRequest,lang:string): Observable<SuggestTopicResponse> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': lang
    });

    this.setLoading(true);
    return this.http.post<SuggestTopicResponse>(this.suggestTopicUrl, request, { headers }).pipe(
      map(res => res),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }
}
