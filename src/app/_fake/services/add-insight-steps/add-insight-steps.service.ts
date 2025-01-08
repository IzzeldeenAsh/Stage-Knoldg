import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { catchError, finalize, map } from "rxjs/operators";
import { TranslationService } from "src/app/modules/i18n";

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
  };
}

export interface SuggestTopicRequest {
  industry_id: number;
  name: {
    en: string;
    ar: string;
  };
}

export interface SuggestTopicResponse {
  data: {
    topic_id: number;
  };
}

export interface AddKnowledgeDocumentRequest {
  file_name: string;
  table_of_content: string;
  price: string;
  file: File;
  status?: string;
}

export interface DocumentInfo {
  id: number;
  file_name: string;
  table_of_content: string;
  price: string;
}

export interface DocumentListResponse {
  data: DocumentInfo[];
}

export interface DocumentUrlResponse {
  data: {
    url: string;
  };
}

@Injectable({
  providedIn: "root",
})
export class AddInsightStepsService {
  private insightaHost = "https://api.foresighta.co";
  private apiUrl = `${this.insightaHost}/api/insighter/library/knowledge`;
  private suggestTopicUrl = `${this.insightaHost}/api/insighter/topic/suggest`;

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();
  currentLang: string = "en";

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) {
    this.currentLang = this.translationService.getSelectedLanguage();
    this.translationService.onLanguageChange().subscribe((lang) => {
      this.currentLang = lang || "en";
    });
  }

  private setLoading(loading: boolean) {
    this.isLoadingSubject.next(loading);
  }

  private handleError(error: any) {
    return throwError(error);
  }

  step2CreateKnowledge(
    request: CreateKnowledgeRequest
  ): Observable<CreateKnowledgeResponse> {
    const headers = new HttpHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
      "Accept-Language": this.currentLang,
    });

    this.setLoading(true);
    return this.http
      .post<CreateKnowledgeResponse>(this.apiUrl, request, { headers })
      .pipe(
        map((res) => res),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  step2UpdateKnowledge(
    knowledgeId: number,
    request: CreateKnowledgeRequest
  ): Observable<CreateKnowledgeResponse> {
    const headers = new HttpHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
      "Accept-Language": this.currentLang,
    });

    this.setLoading(true);
    return this.http
      .put<CreateKnowledgeResponse>(`${this.apiUrl}/${knowledgeId}`, request, {
        headers,
      })
      .pipe(
        map((res) => res),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  createSuggestTopic(
    request: SuggestTopicRequest,
    lang: string
  ): Observable<SuggestTopicResponse> {
    const headers = new HttpHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
      "Accept-Language": lang,
    });

    this.setLoading(true);
    return this.http
      .post<SuggestTopicResponse>(this.suggestTopicUrl, request, { headers })
      .pipe(
        map((res) => res),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  step3AddKnowledgeDocument(
    knowledgeId: number,
    request: AddKnowledgeDocumentRequest,
    isUpdate: boolean = false
  ): Observable<any> {
    const formData = new FormData();
    formData.append("file_name", request.file_name);
    formData.append("table_of_content", request.table_of_content);
    formData.append("price", request.price);
    formData.append("file", request.file);
    formData.append("status", request.status || "active");
    // This will act like a PUT request for update 
    if (isUpdate) {
      formData.append("_method", "PUT");
    }

    const headers = new HttpHeaders({
      Accept: "application/json",
      "Accept-Language": this.currentLang,
    });

    this.setLoading(true);
    return this.http
      .post(`${this.apiUrl}/document/upload/${knowledgeId}`, formData, {
        headers,
      })
      .pipe(
        map((res) => res),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  getListDocumentsInfo(knowledgeId: number): Observable<DocumentListResponse> {
    const headers = new HttpHeaders({
      Accept: "application/json",
      "Accept-Language": this.currentLang,
    });

    this.setLoading(true);
    return this.http
      .get<DocumentListResponse>(`${this.apiUrl}/document/list/${knowledgeId}`, {
        headers,
      })
      .pipe(
        map((res) => res),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  getDocumentUrl(documentId: number): Observable<DocumentUrlResponse> {
    const headers = new HttpHeaders({
      Accept: "application/json",
      "Accept-Language": this.currentLang,
    });

    this.setLoading(true);
    return this.http
      .get<DocumentUrlResponse>(`${this.apiUrl}/document/download/${documentId}`, {
        headers,
      })
      .pipe(
        map((res) => res),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }

  deleteKnowledgeDocument(documentId: number): Observable<any> {
    const headers = new HttpHeaders({
      Accept: "application/json",
      "Accept-Language": this.currentLang,
    });

    this.setLoading(true);
    return this.http
      .delete(`${this.apiUrl}/document/${documentId}`, {
        headers,
      })
      .pipe(
        map((res) => res),
        catchError((error) => this.handleError(error)),
        finalize(() => this.setLoading(false))
      );
  }
}