import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService, UserType } from 'src/app/modules/auth';
import { TranslationService } from 'src/app/modules/i18n';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  @Input() appHeaderDefaulMenuDisplay: boolean;
  @Input() isRtl: boolean;

  itemClass: string = 'ms-1 ms-lg-3';
  btnClass: string = 'btn btn-icon btn-custom btn-icon-muted btn-active-light btn-active-color-primary w-35px h-35px w-md-40px h-md-40px';
  userAvatarClass: string = 'symbol-35px symbol-md-40px';
  btnIconClass: string = 'fs-2 fs-md-1';
  user$: Observable<UserType>;
  constructor(
    private auth: AuthService,
    private translationService: TranslationService
  ) {}

  ngOnInit(): void {
    this.user$ = this.auth.currentUserSubject.asObservable();
  }

}
