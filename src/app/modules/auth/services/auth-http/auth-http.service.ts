import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ForesightaGeneralUserModel, UserModel } from '../../models/user.model';
import { environment } from '../../../../../environments/environment';
import { AuthModel } from '../../models/auth.model';
import { CookieService } from '../cookie.service';

const API_USERS_URL = `auth`;
const API_GENERALREGISTER= 'https://api.foresighta.co/api/auth/register'

@Injectable({
  providedIn: 'root',
})
export class AuthHTTPService {
  private authCookieName = 'foresighta-creds';

  constructor(
    private http: HttpClient,
    private cookieService: CookieService
  ) {}
  
  private apiUrlLogin = 'https://api.foresighta.co/api/auth/login';
  
  // public methods
  login(email: string, password: string, lang: string): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Accept-Language': lang,
      // Enable withCredentials to allow cookies to be sent and received
      'withCredentials': 'true'
    });
    
    return this.http.post<any>(
      this.apiUrlLogin, 
      { email, password },
      { headers, withCredentials: true }
    );
  }

  // CREATE =>  POST: add a new user to the server
  createUser(user: ForesightaGeneralUserModel): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Accept-Language': 'en_us',
      'withCredentials': 'true'
    });

    return this.http.post<ForesightaGeneralUserModel>(
      API_GENERALREGISTER, 
      user,
      { headers, withCredentials: true }
    );
  }

  // Your server should check email => If email exists send link to the user and return true | If email doesn't exist return false
  forgotPassword(email: string): Observable<boolean> {
    return this.http.post<boolean>(
      `${API_USERS_URL}/forgot-password`, 
      { email },
      { withCredentials: true }
    );
  }

  // Get authentication token from cookie
  getAuthToken(): string | null {
    const authData = this.cookieService.getCookie(this.authCookieName);
    if (authData) {
      try {
        const parsedData = JSON.parse(authData);
        return parsedData.authToken || null;
      } catch (error) {
        console.error('Error parsing auth cookie:', error);
        return null;
      }
    }
    return null;
  }

  // Create headers with authentication token
  getAuthHeaders(lang: string = 'en'): HttpHeaders {
    const token = this.getAuthToken();
    let headers = new HttpHeaders({
      'Accept': 'application/json',
      'Accept-Language': lang,
      'withCredentials': 'true'
    });
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    
    return headers;
  }

  getUserByToken(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get<UserModel>(
      'https://api.foresighta.co/api/account/profile', 
      { headers, withCredentials: true }
    );
  }
}
