import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { BehaviorSubject, Observable, throwError } from "rxjs";
import { catchError, finalize, map } from "rxjs/operators";
import { TranslationService } from "src/app/modules/i18n/translation.service";
import { environment } from "src/environments/environment";

export interface Document {
  id: string;
  name: string;
}

export interface DocumentResponse {
  data: Document[];
}

type AccountType = "personal" | "corporate" | "company" | string | undefined;

@Injectable({
  providedIn: "root",
})
export class DocumentsService {
  private readonly insighterPath =
    "/common/setting/insighter/document-type/list";
  private readonly companyPath = "/common/setting/company/document-type/list";

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();

  private currentLang: string = "en";

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) {
    this.translationService.onLanguageChange().subscribe((lang) => {
      this.currentLang = lang || "en";
    });
  }

  private setLoading(loading: boolean) {
    this.isLoadingSubject.next(loading);
  }

  private handleError(error: any) {
    // Keep console for dev visibility (caller shows toast).
    // eslint-disable-next-line no-console
    console.error("Error fetching document types:", error);
    return throwError(() => error);
  }

  private resolvePath(accountType: AccountType): string {
    // Wizard uses 'personal' vs everything-else; also accept 'corporate'/'company' explicitly.
    const isCompany =
      accountType === "corporate" || accountType === "company";
    return isCompany ? this.companyPath : this.insighterPath;
  }

  getDocumentsTypes(accountType?: AccountType): Observable<Document[]> {
    const headers = new HttpHeaders({
      Accept: "application/json",
      "Content-Type": "application/json",
      "Accept-Language": this.currentLang,
      "X-Timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    const url = `${environment.apiBaseUrl}${this.resolvePath(accountType)}`;

    this.setLoading(true);
    return this.http.get<DocumentResponse>(url, { headers }).pipe(
      map((res) => res.data || []),
      catchError((error) => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }
}

// Backward-compatible alias (in case anything imports this name elsewhere).
@Injectable({
  providedIn: "root",
})
export class DocumentsTypesService extends DocumentsService {}
