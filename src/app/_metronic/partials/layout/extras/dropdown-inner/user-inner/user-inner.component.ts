import { Component, HostBinding, Input, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription, first } from 'rxjs';
import { TranslationService } from '../../../../../../modules/i18n';
import { AuthService, UserType } from '../../../../../../modules/auth';
import { Router } from '@angular/router';
import { IForsightaProfile } from 'src/app/_fake/models/profile.interface';

@Component({
  selector: 'app-user-inner',
  templateUrl: './user-inner.component.html',
})
export class UserInnerComponent implements OnInit, OnDestroy {
  @HostBinding('class')
  class = `menu menu-sub menu-sub-dropdown menu-column menu-rounded menu-gray-600 menu-state-bg menu-state-primary fw-bold py-4 fs-6 w-275px`;
  @HostBinding('attr.data-kt-menu') dataKtMenu = 'true';
  @Input() userProfile:IForsightaProfile;
  language: LanguageFlag;
  langs = languages;
  private unsubscribe: Subscription[] = [];

  constructor(
    private auth: AuthService,
    private translationService: TranslationService,
    private router:Router
  ) {}

  ngOnInit(): void {
   
    this.setLanguage(this.translationService.getSelectedLanguage());
  }

  logout() {
    this.auth.logout().pipe(first()).subscribe({
      next : (res)=>{
          localStorage.removeItem("foresighta-creds");
          localStorage.removeItem("currentUser");
          localStorage.removeItem("authToken");
          this.router.navigate(['/auth'])
      },
      error: (err)=>{
        localStorage.removeItem("foresighta-creds");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("authToken");
        this.router.navigate(['/auth'])
      }
    });
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
    lang: 'zh',
    name: 'Mandarin',
    flag: './assets/media/flags/china.svg',
  },
  {
    lang: 'es',
    name: 'Spanish',
    flag: './assets/media/flags/spain.svg',
  },
  {
    lang: 'ja',
    name: 'Japanese',
    flag: './assets/media/flags/japan.svg',
  },
  {
    lang: 'de',
    name: 'German',
    flag: './assets/media/flags/germany.svg',
  },
  {
    lang: 'fr',
    name: 'French',
    flag: './assets/media/flags/france.svg',
  },
];
