import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { BehaviorSubject, Observable, Subject, throwError } from "rxjs";
import { map, catchError, finalize, tap, shareReplay } from "rxjs/operators";
import { TranslationService } from "src/app/modules/i18n";
import { Router } from "@angular/router";

interface UserType {
  id: string;
  name: string;
  email: string;
  countryId: string | null;
  country: string | null;
  roles: string[];
}

@Injectable({
  providedIn: "root",
})
export class ProfileService {
  private readonly API_URL = "https://api.foresighta.co/api/account/profile";
  private profileCache$: Observable<any> | null = null;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private userSubject = new BehaviorSubject<UserType | null>(null);
  private profileUpdateSubject = new Subject<void>();
  currentLang: string = "";
  isLoading$ = this.isLoadingSubject.asObservable();
  currentUser$ = this.userSubject.asObservable();
  profileUpdate$ = this.profileUpdateSubject.asObservable();

  constructor(
    private http: HttpClient,
    private translateService: TranslationService,
    private router: Router
  ) {
    // Initialize from localStorage if available
    const savedUser = this.getUserFromLocalStorage();
    if (savedUser) {
      this.userSubject.next(savedUser);
    }
    this.currentLang = this.translateService.getSelectedLanguage()
      ? this.translateService.getSelectedLanguage()
      : "en";
  }

  getProfile(isPass: boolean = false): Observable<any> {
    // Return cached observable if it exists
    if (this.profileCache$) {
      return this.profileCache$;
    }

    this.isLoadingSubject.next(true);
    const headers = new HttpHeaders({
      Accept: "application/json",
      "Accept-Language": this.currentLang,
    });

    // Create and cache the new observable
    this.profileCache$ = this.http.get(this.API_URL, { headers }).pipe(
      map((response: any) => {
        const user: UserType = {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          countryId: null,
          country: null,
          roles: response.data.roles || []
        };
        this.setUserInLocalStorage(user);
        this.userSubject.next(user);
        this.profileUpdateSubject.next(); // Notify subscribers of update
        return response.data;
      }),
      catchError((err) => {
        this.profileCache$ = null; // Clear cache on error
        if (err.status === 401) {
          localStorage.removeItem("foresighta-creds");
          localStorage.removeItem("user");
          this.clearProfile();
          this.router.navigate(["/auth"]).then(() => {
            // Optional: Reload the page after navigation if needed
            window.location.reload();
          });
        }
        return throwError(err);
      }),
      finalize(() => this.isLoadingSubject.next(false)),
      shareReplay(1) // Cache the result
    );

    return this.profileCache$;
  }

  hasRole(roles: string[]): Observable<boolean> {
    return this.getProfile().pipe(
      map(profile => {
        const userRoles = profile.roles || [];
        return roles.some(role => userRoles.includes(role));
      })
    );
  }

  // Force refresh the profile
  refreshProfile(): Observable<any> {
    this.profileCache$ = null;
    return this.getProfile();
  }

  // Get current user synchronously
  getCurrentUser(): UserType | null {
    return this.userSubject.value;
  }

  // Clear profile (useful for logout)
  clearProfile(): void {
    this.profileCache$ = null;
    this.userSubject.next(null);
    this.profileUpdateSubject.next(); // Notify subscribers of clear
    localStorage.removeItem("user"); // Adjust key as needed
  }

  private setUserInLocalStorage(user: UserType): void {
    localStorage.setItem("user", JSON.stringify(user));
  }

  private getUserFromLocalStorage(): UserType | null {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }
}
