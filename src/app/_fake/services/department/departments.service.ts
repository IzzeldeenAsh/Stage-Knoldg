import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, finalize, map, throwError } from 'rxjs';
import { TranslationService } from 'src/app/modules/i18n/translation.service';

export interface Department {
  id: number;
  name: string;
  names: {
    en: string;
    ar: string;
  };
}

export interface DepartmentResponse {
  data: Department[];
}

@Injectable({
  providedIn: 'root'
})
export class DepartmentsService {
  private apiUrl = 'https://api.4sighta.com/api/common/setting/department/list'; // Replace with the actual API URL
  private createApi = "https://api.4sighta.com/api/admin/setting/department"; // Replace with the actual API URL
  private updateDeleteApi = "https://api.4sighta.com/api/admin/setting/department"; // Replace with the actual API URL
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$: Observable<boolean> = this.isLoadingSubject.asObservable();
  currentLang:string = "en"
  constructor(
    private http: HttpClient,
    private translationService: TranslationService,
  
  ) {
    this.translationService.onLanguageChange().subscribe(lang=>{
     this.currentLang = lang
    })
   
  }

  private setLoading(loading: boolean) {
    this.isLoadingSubject.next(loading);
  }

  // Your custom handleError method
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

  // Fetch department data from the API
  getDepartments(): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': this.currentLang
    });

    this.setLoading(true);
    return this.http.get<any>(this.apiUrl, { headers }).pipe(
      map((res) => res.data), // Adjust this based on the API response structure
      catchError((error) => this.handleError(error)), // Use the custom error handler
      finalize(() => this.setLoading(false))
    );
  }

  createDepartment(department: any): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': this.currentLang
    });

    this.setLoading(true);
    return this.http.post<any>(this.createApi, department, { headers }).pipe(
      map((res) => res),
      catchError((error) => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  // Method to update an existing department (PUT request)
  updateDepartment(departmentId: number, updatedData: { name: { en: string; ar: string; } }): Observable<Department> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': this.currentLang
    });

    this.setLoading(true);
    return this.http.put<Department>(`${this.updateDeleteApi}/${departmentId}`, updatedData, { headers }).pipe(
      map((res) => res),
      catchError((error) => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }

  deleteDepartment(departmentId: number): Observable<any> {
    const headers = new HttpHeaders({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Accept-Language': this.currentLang
    });

    this.setLoading(true);
    return this.http.delete<any>(`${this.updateDeleteApi}/${departmentId}`, { headers }).pipe(
      map((res) => res),
      catchError((error) => this.handleError(error)),
      finalize(() => this.setLoading(false))
    );
  }


}