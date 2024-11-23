import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription, first } from 'rxjs';
import { TranslationService } from '../../../../../../modules/i18n';
import { AuthService, UserType } from '../../../../../../modules/auth';
import { IForsightaProfile } from 'src/app/_fake/models/profile.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-inner',
  templateUrl: './user-inner.component.html',
})
export class UserInnerComponent implements OnInit, OnDestroy {
  @HostBinding('class')
  class = `menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg menu-state-primary fw-bold py-4 fs-6 w-275px`;
  @HostBinding('attr.data-kt-menu') dataKtMenu = 'true';

  language: LanguageFlag;
  user$: Observable<IForsightaProfile>;
  langs = languages;
  private unsubscribe: Subscription[] = [];

  constructor(
    private auth: AuthService,
    private translationService: TranslationService,
    private router:Router
  ) {}

  ngOnInit(): void {
    this.user$ = this.auth.getProfile().pipe(first())
    this.setLanguage(this.translationService.getSelectedLanguage());
  }

  logout() {
   const authLogout =   this.auth.logout().pipe(first()).subscribe({
    next : (res)=>{
        localStorage.removeItem("foresighta-creds");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("authToken");
        this.router.navigate(['auth'])
    },
    error: (err)=>{
      localStorage.removeItem("foresighta-creds");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("authToken");
      this.router.navigate(['auth'])
    }
  });
   this.unsubscribe.push(authLogout)

  }

  selectLanguage(lang: string) {
    this.translationService.setLanguage(lang);
    this.setLanguage(lang);
    // document.location.reload();
  }

  setLanguage(lang: string) {
    this.langs.forEach((language: LanguageFlag) => {
      if (language.lang === lang) {
        language.active = true;
        this.language = language;
      } else {
        language.active = false;
      }
    });
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

const languages = [
  {
    lang: 'en',
    name: 'English',
    flag: './assets/media/flags/united-states.svg',
  },
  {
    lang: 'ar',
    name: 'Arabic',
    flag: './assets/media/flags/saudi-arabia.svg',
  }
];
