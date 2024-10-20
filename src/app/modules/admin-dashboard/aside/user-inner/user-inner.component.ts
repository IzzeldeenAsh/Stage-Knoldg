import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-user-inner',
  templateUrl: './user-inner.component.html',
})
export class UserInnerComponent implements OnInit, OnDestroy {
  @HostBinding('class')
  class = `menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg menu-state-primary fw-bold py-4 fs-6 w-275px`;
  @HostBinding('attr.data-kt-menu') dataKtMenu = 'true';

  language!: LanguageFlag;
  // user$!: Observable<IUser>;
  private unsubscribe: Subscription[] = [];

  constructor(
    
    private router:Router,
  ) {}

  ngOnInit(): void {
    // this.user$ = this._currentUser.currentUserProfile$
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.clear();
    this.router.navigate(['/auth']);
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}

interface LanguageFlag {
  lang: string;
  name: string;
  flag: string;
  active?: boolean;
}

