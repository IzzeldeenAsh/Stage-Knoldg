import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, finalize, map, throwError } from 'rxjs';
import { UserPreRegistration } from '../../models/pre-user.model';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class PreRegsiterService {
  private apiUrl = 'https://myinsighta.com/api/register-potential-insighter';
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) {} // Inject MessageService

  private setLoading(loading: boolean) {
    this.isLoadingSubject.next(loading);
  }

  private handleError(error: any) {
    console.log('Error from service', error.error.errors);
  
    // Initialize an empty array to hold the formatted error messages
    let validationErrors: any[] = [];
  
    // Check if there are validation errors in the response
    if (error.error.errors) {
      const errors = error.error.errors;
      for (const field in errors) {
        if (errors.hasOwnProperty(field)) {
          const errorMsgArray = errors[field];
          errorMsgArray.forEach((msg: string) => {
            validationErrors.push({ severity: 'error', summary: 'Validation Error', detail: msg });
          });
        }
      }
    }
  
    // Return the array of validation error messages to the component
    return throwError(() => ({
      validationMessages: validationErrors
    }));
  }

  preRegisterUser(user: UserPreRegistration, lang: string = 'en'): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'lang': lang
    });

    this.setLoading(true);
    return this.http.post<any>(this.apiUrl, user, { headers }).pipe(
      map(res => res),
      catchError((error) => this.handleError(error)), // Handle error
      finalize(() => this.setLoading(false))
    );
  }
}