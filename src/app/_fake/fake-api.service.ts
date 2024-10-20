import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { UsersTable } from './users.table';

@Injectable({
  providedIn: 'root',
})
export class FakeAPIService {
  private users: any[] = UsersTable.users;

  constructor() { }

  /**
   * Mock API to return users
   */
  getUsers(): Observable<any[]> {
    return of(this.users);
  }
}