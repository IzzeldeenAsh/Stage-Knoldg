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
import { environment } from "src/environments/environment";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { IForsightaProfile } from "src/app/_fake/models/profile.interface";
import { TranslationService } from "../../i18n";

export type UserType = InsightaUserModel | undefined;

@Injectable({
  providedIn: "root",
})
export class AuthService implements OnDestroy {
  // private fields
  private unsubscribe: Subscription[] = []; 
  private authLocalStorageToken = `foresighta-creds`;
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
    private translationService:TranslationService
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
        this.setAuthFromLocalStorage(auth);
        return response.data;
      }),
      switchMap(() => {
        return this.http.get('https://api.foresighta.co/api/account/profile').pipe(
          map((profileResponse: any) => {
            if (profileResponse.data.roles.includes('admin')) {
              this.router.navigate(['/admin-dashboard']);
            } else {
              this.router.navigate(['/app']);
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
    return this.http.get('https://api.foresighta.co/api/auth/provider/google', { responseType: 'text' });
  }
  getLinkedInAuthRedirectUrl(): Observable<string> {
    return this.http.get('https://api.foresighta.co/api/auth/provider/linkedin', { responseType: 'text' });
  }
  private setUserInLocalStorage(user: UserType): void {
    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user));
    }
  }
  private getUserFromLocalStorage(): UserType | undefined {
    const userJson = localStorage.getItem("currentUser");
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

  getProfile():Observable<any>{
    this.isLoadingSubject.next(true);
    const headers = new HttpHeaders({
      Accept: "application/json",
      "Accept-Language": this.currentLang, // As per your example
    });
    return this.http.get('https://api.foresighta.co/api/account/profile',{headers}).pipe(
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
  logout():Observable<any> {
    const token = this.getAuthFromLocalStorage()?.authToken;
    if(token){
      localStorage.removeItem("foresighta-creds");
      localStorage.removeItem("user");
      return this.http.post<any>('https://api.foresighta.co/api/account/logout',{token})
    }
    return of(null);
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
          localStorage.removeItem("foresighta-creds");
          localStorage.removeItem("currentUser");
          localStorage.removeItem("user");
          localStorage.removeItem("authToken");
          document.location.reload();
          
        },
        error: () => {
          localStorage.removeItem("foresighta-creds");
          localStorage.removeItem("currentUser");
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
        this.setAuthFromLocalStorage(auth);
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
  setAuthFromLocalStorage(auth: AuthModel): boolean {
    // store auth authToken/refreshToken/epiresIn in local storage to keep user logged in between page refreshes
    if (auth && auth.authToken) {
      localStorage.setItem(this.authLocalStorageToken, JSON.stringify(auth));
      return true;
    }
    return false;
  }

  getAuthFromLocalStorage(): AuthModel | undefined {
    try {
      const lsValue = localStorage.getItem(this.authLocalStorageToken);
      if (!lsValue) {
        return undefined;
      }
      const authData = JSON.parse(lsValue);
      return authData;
    } catch (error) {
      console.error(error);
      return undefined;
    }
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
      'Accept-Language': 'en'
    });
    return this.http.post('https://api.foresighta.co/api/account/email/resend',{ headers }).pipe(
      map((res) => res), // Adjust this based on the API response structure
      catchError((error) => this.handleError(error))// Use the custom error handler
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
}