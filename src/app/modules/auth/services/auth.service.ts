import { Injectable, OnDestroy } from "@angular/core";
import {
  Observable,
  BehaviorSubject,
  of,
  Subscription,
  throwError,
} from "rxjs";
import { map, catchError, switchMap, finalize, take, first, tap, mapTo } from "rxjs/operators";
import { ForesightaGeneralUserModel, UserModel } from "../models/user.model";
import { AuthModel } from "../models/auth.model";
import { Router } from "@angular/router";
import { AuthHTTPService } from "./auth-http/auth-http.service";
import { InsightaUserModel } from "../models/insighta-user.model";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { TranslationService } from "../../i18n";
import { CookieService } from "./cookie.service";
import { environment } from "src/environments/environment";

export type UserType = InsightaUserModel | undefined;

@Injectable({
  providedIn: "root",
})
export class AuthService implements OnDestroy {
  // private fields
  private unsubscribe: Subscription[] = []; 
  private authLocalStorageKey = `foresighta-creds`;
  private userLocalStorageKey = `currentUser`;
  // public fields
  currentUser$: Observable<UserType>;
  isLoading$: Observable<boolean>;
  currentUserSubject: BehaviorSubject<UserType>;
  isLoadingSubject: BehaviorSubject<boolean>;
  currentLang:string='en'
  constructor(
    private authHttpService: AuthHTTPService,
    private router: Router,
    private http: HttpClient,
    private translationService: TranslationService,
    private cookieService: CookieService
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.currentUserSubject = new BehaviorSubject<UserType>(undefined);
    this.currentUser$ = this.currentUserSubject.asObservable();
    this.isLoading$ = this.isLoadingSubject.asObservable();
    const subscr = this.getUserByToken().subscribe();
    this.unsubscribe.push(subscr);
    this.translationService.onLanguageChange().subscribe((lang) => {
      this.currentLang = lang || 'en';
    });
  }
  //Current User Getter Setter
  get currentUserValue(): UserType {
    return this.currentUserSubject.value;
  }
  set currentUserValue(user: UserType) {
    this.currentUserSubject.next(user);
  }
 
  // public methods
  login(email: string, password: string, lang:string): Observable<UserType> {
    this.isLoadingSubject.next(true);
    return this.authHttpService.login(email, password, lang).pipe(
      map((response: any) => {
        const auth = new AuthModel();
        auth.authToken = response.data.token;
        this.setAuthInLocalStorage(auth);
        
        // Also store token in Next.js format for better compatibility
        localStorage.setItem('token', response.data.token);
        
        return response.data;
      }),
      switchMap(() => {
        const headers = new HttpHeaders({
          Accept: "application/json",
          "Accept-Language": this.currentLang,
          "Authorization": `Bearer ${this.getAuthFromLocalStorage()?.authToken || ''}`
        });
        return this.http.get('https://api.knoldg.com/api/account/profile', {
          headers
        }).pipe(
          map((profileResponse: any) => {
            if (profileResponse.data.roles.includes('admin') || profileResponse.data.roles.includes('staff')) {
              this.router.navigate(['/admin-dashboard']);
            } else {
              const authData = this.getAuthFromLocalStorage();
              if (authData && authData.authToken) {
                // Use path parameter format for consistency and improved security
                // This will go to the Next.js [locale]/callback/[token] route
                window.location.href = `${environment.mainAppUrl}/en/callback/${authData.authToken}`;
              }
            }
            return profileResponse.data;
          })
        );
      }),
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
  getGoogleAuthRedirectUrl(): Observable<string> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Accept-Language': 'en'
    });
    return this.http.get('https://api.knoldg.com/api/auth/provider/google', { 
      headers,
      responseType: 'text'
    });
  }
  getLinkedInAuthRedirectUrl(): Observable<string> {
    const headers = new HttpHeaders({
      'Accept': 'application/json', 
      'Accept-Language': 'en'
    });
    return this.http.get('https://api.knoldg.com/api/auth/provider/linkedin-openid', {
      headers,
      responseType: 'text'
    });
  }
  private setUserInLocalStorage(user: UserType): void {
    if (user) {
      localStorage.setItem(this.userLocalStorageKey, JSON.stringify(user));
    }
  }
  private getUserFromLocalStorage(): UserType | undefined {
    const userJson = localStorage.getItem(this.userLocalStorageKey);
    if (userJson) {
      return JSON.parse(userJson) as UserType;
    }
    return undefined;
  }
  private handleError(error: any) {
    // Initialize an empty array to hold the formatted error messages
    let validationErrors: any[] = [];

    // Check if there are validation errors in the response
    if (error.error.errors) {
      const errors = error.error.errors;
      for (const field in errors) {
        if (errors.hasOwnProperty(field)) {
          const errorMsgArray = errors[field];
          errorMsgArray.forEach((msg: string) => {
            validationErrors.push({
              severity: "error",
              summary: "Validation Error",
              detail: msg,
            });
          });
        }
      }
    }

    // Return the array of validation error messages to the component
    return throwError(() => ({
      validationMessages: validationErrors,
    }));
  }
   isTokenExpired(token: string): boolean {
    if (!token) {
      return true;
    }

    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  }

  getProfile(): Observable<any>{
    this.isLoadingSubject.next(true);
    const headers = new HttpHeaders({
      Accept: "application/json",
      "Accept-Language": this.currentLang,
      "Authorization": `Bearer ${this.getAuthFromLocalStorage()?.authToken || ''}`,
    });
    return this.http.get('https://api.knoldg.com/api/account/profile', {
      headers
    }).pipe(
      map((response: any) => {
        this.isLoadingSubject.next(false);
        const user: UserType = {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          countryId: null,
          country: null,
        };
        this.setUserInLocalStorage(user);
        return response.data
      }),
      catchError((err) => {
        return throwError(err);
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  
  logout(): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Accept-Language': 'en',
      'Authorization': `Bearer ${this.getAuthFromLocalStorage()?.authToken || ''}`,
    });
    return this.http.post<any>(
      'https://api.knoldg.com/api/account/logout',
      {},
      { headers }
    );
  }
  
  getUserByToken(): Observable<any> {
    const authData = this.getAuthFromLocalStorage();
    if (authData) { // Check if authData exists
      if (!this.isTokenExpired(authData.authToken)) {
        const user = this.getUserFromLocalStorage();
        if (user) {
          this.currentUserSubject.next(user);
          return of(user);
        } 
      } else {
        // Token is expired; perform logout
        return this.handleLogout();
      }
    }
    // No authData; allow unauthenticated access without logout
    return of(undefined);
  }
  
   handleLogout(): Observable<void> {
    return this.logout().pipe(first()).pipe(
      tap({
        next: () => {
          localStorage.removeItem(this.authLocalStorageKey);
          localStorage.removeItem(this.userLocalStorageKey);
          localStorage.removeItem("user");
          localStorage.removeItem("authToken");
          document.location.reload();
          
        },
        error: () => {
          localStorage.removeItem(this.authLocalStorageKey);
          localStorage.removeItem(this.userLocalStorageKey);
          localStorage.removeItem("user");
          localStorage.removeItem("authToken");
          document.location.reload();
        }
      }),
      // Return an observable that completes after handling logout
      mapTo(undefined)
    );
  }
  
  // need create new user then login
  registration(user: ForesightaGeneralUserModel): Observable<any> {
    this.isLoadingSubject.next(true);
    return this.authHttpService.createUser(user).pipe(
      map((response: any) => {
        this.isLoadingSubject.next(false);
        const auth = new AuthModel();
        auth.authToken = response.data.token; 
        this.setAuthInLocalStorage(auth);
        const user: UserType = {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          countryId: response.data.country_id,
          country: response.data.country,
        };

        this.setUserInLocalStorage(user);
        this.currentUserSubject.next(user);
      }),
      catchError((err) => {
        return throwError(err);
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  forgotPassword(email: string): Observable<boolean> {
    this.isLoadingSubject.next(true);
    return this.authHttpService
      .forgotPassword(email)
      .pipe(finalize(() => this.isLoadingSubject.next(false)));
  }

  // private methods
  setAuthInLocalStorage(auth: AuthModel): boolean {
    // store auth authToken/refreshToken/epiresIn in localStorage to keep user logged in between page refreshes
    if (auth && auth.authToken) {
      localStorage.setItem(this.authLocalStorageKey, JSON.stringify(auth));
      return true;
    }
    return false;
  }

  getAuthFromLocalStorage(): AuthModel | undefined {
    try {
      const authDataString = localStorage.getItem(this.authLocalStorageKey);
      if (!authDataString) {
        return undefined;
      }
      const authData = JSON.parse(authDataString);
      return authData;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }
  
  // Method to get token from URL (for the callback route)
  getTokenFromUrl(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('token');
  }
  
  // Method to set token received from URL
  setTokenFromUrl(): boolean {
    const token = this.getTokenFromUrl();
    if (token) {
      const auth = new AuthModel();
      auth.authToken = token;
      this.setAuthInLocalStorage(auth);
      return true;
    }
    return false;
  }
  
  checkUserRoleAndRedirect(user: any) {
    if (user) {
      if (
        user.roles &&
        (user.roles.includes("admin") || user.roles.includes("staff"))
      ) {
        this.router.navigate(["/admin-dashboard"]);
      }else{
        this.router.navigate(["/app"]);
      }
    }
  }
  resendVerificationEmail(): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': 'en',
      'Authorization': `Bearer ${this.getAuthFromLocalStorage()?.authToken || ''}`,
    });
    return this.http.post('https://api.knoldg.com/api/account/email/resend', 
      {}, 
      { headers }
    ).pipe(
      map((res) => res),
      catchError((error) => this.handleError(error))
    );
  }

  getCurrentUserId(): number | undefined {
    const currentUser = this.currentUserValue; 
    if (currentUser && currentUser.id) {
      return currentUser.id;
    }
    return undefined;
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }

  // Function to share auth token with another domain
  shareAuthWithDomain(targetDomain: string): void {
    const authData = this.getAuthFromLocalStorage();
    if (!authData || !authData.authToken) {
      console.error('No auth token to share');
      return;
    }
    
    // Approach 1: Using window.open with postMessage
    const authWindow = window.open(`${targetDomain}/auth-receiver`, 'auth_window', 'width=800,height=600');
    
    const checkReadyInterval = setInterval(() => {
      try {
        // Send the token once we get the READY message or after a timeout
        authWindow?.postMessage({ 
          type: 'AUTH_TOKEN', 
          token: authData.authToken 
        }, targetDomain);
      } catch (e) {
        console.error('Error posting message:', e);
      }
    }, 1000);
    
    // Listen for success message from the popup
    window.addEventListener('message', (event) => {
      if (event.origin === targetDomain && event.data.type === 'AUTH_SUCCESS') {
        clearInterval(checkReadyInterval);
        authWindow?.close();
      }
    }, { once: true });
    
    // Cleanup if window closed
    const checkClosedInterval = setInterval(() => {
      if (authWindow?.closed) {
        clearInterval(checkReadyInterval);
        clearInterval(checkClosedInterval);
      }
    }, 500);
    
    // Fallback approach: direct URL with token
    setTimeout(() => {
      if (authWindow) {
        authWindow.location.href = `${targetDomain}/auth-receiver?token=${authData.authToken}`;
      }
    }, 2000);
  }
}