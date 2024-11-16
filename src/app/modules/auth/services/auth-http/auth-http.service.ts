import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ForesightaGeneralUserModel, UserModel } from '../../models/user.model';
import { environment } from '../../../../../environments/environment';
import { AuthModel } from '../../models/auth.model';

const API_USERS_URL = `auth`;
const API_GENERALREGISTER= 'https://api.4sighta.com/api/auth/register'

@Injectable({
  providedIn: 'root',
})
export class AuthHTTPService {
  constructor(private http: HttpClient) {}
  private apiUrlLogin = 'https://api.4sighta.com/api/auth/login';
  // public methods


  login(email: string, password: string): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Accept-Language': 'en' // As per your example
    });
    return this.http.post<any>(this.apiUrlLogin, {
      email,
      password,
    },{headers});
  }

  logout(): Observable<any> {
    const headers = new HttpHeaders({
      Accept: "application/json",
      "Accept-Language": "en", // As per your example
    });
    return this.http.post<any>(
      "https://api.4sighta.com/api/account/logout",
      { headers }
    );
  }

  // CREATE =>  POST: add a new user to the server
  createUser(user: ForesightaGeneralUserModel): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Accept-Language': 'en' // As per your example
    });

    return this.http.post<ForesightaGeneralUserModel>(API_GENERALREGISTER, user,{headers});
  }


 

  // Your server should check email => If email exists send link to the user and return true | If email doesn't exist return false
  forgotPassword(email: string): Observable<boolean> {
    return this.http.post<boolean>(`${API_USERS_URL}/forgot-password`, {
      email,
    });
  }

  getUserByToken(token: string): Observable<UserModel> {
    const httpHeaders = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get<UserModel>(`${API_USERS_URL}/me`, {
      headers: httpHeaders,
    });
  }
}
