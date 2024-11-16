import { Injectable, OnDestroy } from "@angular/core";
import {
  Observable,
  BehaviorSubject,
  of,
  Subscription,
  throwError,
} from "rxjs";
import { map, catchError, switchMap, finalize, take, first } from "rxjs/operators";
import { ForesightaGeneralUserModel, UserModel } from "../models/user.model";
import { AuthModel } from "../models/auth.model";
import { Router } from "@angular/router";
import { AuthHTTPService } from "./auth-http/auth-http.service";
import { InsightaUserModel } from "../models/insighta-user.model";
import { environment } from "src/environments/environment";
import { HttpClient, HttpHeaders } from "@angular/common/http";

export type UserType = InsightaUserModel | undefined;

@Injectable({
  providedIn: "root",
})
export class AuthService implements OnDestroy {
  // private fields
  private unsubscribe: Subscription[] = []; // Read more: => https://brianflove.com/2016/12/11/anguar-2-unsubscribe-observables/
  private authLocalStorageToken = `foresighta-creds`;
  // public fields
  currentUser$: Observable<UserType>;
  isLoading$: Observable<boolean>;
  currentUserSubject: BehaviorSubject<UserType>;
  isLoadingSubject: BehaviorSubject<boolean>;

  get currentUserValue(): UserType {
    return this.currentUserSubject.value;
  }
  set currentUserValue(user: UserType) {
    this.currentUserSubject.next(user);
  }
  constructor(
    private authHttpService: AuthHTTPService,
    private router: Router,
    private http: HttpClient
  ) {
    this.isLoadingSubject = new BehaviorSubject<boolean>(false);
    this.currentUserSubject = new BehaviorSubject<UserType>(undefined);
    this.currentUser$ = this.currentUserSubject.asObservable();
    this.isLoading$ = this.isLoadingSubject.asObservable();
    const subscr = this.getUserByToken().subscribe();
    this.unsubscribe.push(subscr);
  }
  // public methods
  login(email: string, password: string): Observable<UserType> {
    this.isLoadingSubject.next(true);
    return this.authHttpService.login(email, password).pipe(
      map((response: any) => {
        // Extract token and user info from the response
        const auth = new AuthModel();
        auth.authToken = response.data.token; // Extract the token from the response
        this.setAuthFromLocalStorage(auth);
        console.log(response);
        // Store user information in local storage
        const user: UserType = {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          countryId: response.data.countryId,
          country: response.data.country,
          roles: response.data.roles,
          profile_photo_url:response.data.profile_photo_url
        };

        this.setUserInLocalStorage(user);
        this.currentUserSubject.next(user);
        return user;
      }),
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
  getGoogleAuthRedirectUrl(): Observable<string> {
    return this.http.get('https://api.4sighta.com/api/auth/provider/google', { responseType: 'text' });
  }
  getLinkedInAuthRedirectUrl(): Observable<string> {
    return this.http.get('https://api.4sighta.com/api/auth/provider/linkedin', { responseType: 'text' });
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
  private isTokenExpired(token: string): boolean {
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
      "Accept-Language": "en", // As per your example
    });
    return this.http.get('https://api.4sighta.com/api/account/profile',{headers}).pipe(
      map((response: any) => {
        this.isLoadingSubject.next(false);
        return response.data
      }),
      catchError((err) => {
        return throwError(err);
      }),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }
  logout():Observable<any> {
   return this.authHttpService.logout()
   
  }
  getUserByToken(): Observable<UserType> {
    const authData = this.getAuthFromLocalStorage();
    if (authData && !this.isTokenExpired(authData.authToken)) {
      const user = this.getUserFromLocalStorage();
      if (user) {
        this.currentUserSubject.next(user);
        this.checkUserRoleAndRedirect(user);
        return of(user);
      }
    } else {
     
    }

    return of(undefined);
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
  private setAuthFromLocalStorage(auth: AuthModel): boolean {
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
      }
    }
  }
  resendVerificationEmail(): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': 'en'
    });
    return this.http.post('https://api.4sighta.com/api/account/email/resend',{ headers }).pipe(
      map((res) => res), // Adjust this based on the API response structure
      catchError((error) => this.handleError(error))// Use the custom error handler
    );
  }
  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
