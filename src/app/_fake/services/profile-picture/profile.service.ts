import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private uploadUrl = 'https://api.foresighta.co/api/account/profile/photo';
  private removeUrl = 'https://api.foresighta.co/api/account/profile/photo/remove';

  constructor(private http: HttpClient) {}

  updateProfilePhoto(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('profile_photo', file);

    return this.http.post<any>(this.uploadUrl, formData);
  }

  removeProfilePhoto(): Observable<any> {
    return this.http.delete<any>(this.removeUrl);
  }
}
