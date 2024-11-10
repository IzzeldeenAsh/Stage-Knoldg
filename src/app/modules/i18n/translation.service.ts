import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { locale as enLang } from './vocabs/en';
import { locale as arLang } from './vocabs/ar';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private langIds: any = [];
  private currentLang: BehaviorSubject<string> = new BehaviorSubject<string>(this.getSelectedLanguage());

  constructor(private translate: TranslateService) {
    this.translate.addLangs(['en', 'ar']);
    this.translate.setDefaultLang('en');
    this.loadTranslations(enLang, arLang);
  }

  loadTranslations(...args: any[]): void {
    const locales = [...args];
    locales.forEach((locale) => {
      this.translate.setTranslation(locale.lang, locale.data, true);
      this.langIds.push(locale.lang);
    });
    this.translate.addLangs(this.langIds);
    this.translate.use(this.getSelectedLanguage());
    this.updateDirection(this.getSelectedLanguage());
  }

  setLanguage(lang: string) {
    if (lang) {
      this.translate.use(lang);
      localStorage.setItem('language', lang);
      this.updateDirection(lang);
      this.currentLang.next(lang);
    }
  }

  onLanguageChange() {
    return this.currentLang.asObservable(); // Expose an observable for global subscriptions
  }

  getSelectedLanguage(): any {
    return localStorage.getItem('language') || 'en';
  }

  updateDirection(lang: string) {
    const htmlElement = document.documentElement;

    if (lang === 'ar') {
      htmlElement.setAttribute('dir', 'rtl');
      htmlElement.setAttribute('lang', 'ar');
      this.loadArabicFont();
      htmlElement.style.fontFamily = '"Tajawal", sans-serif'; // Apply the Tajawal font
    } else {
      htmlElement.setAttribute('dir', 'ltr');
      htmlElement.setAttribute('lang', 'en');
      this.removeArabicFont();
      htmlElement.style.fontFamily = ''; // Revert to the default font family
    }
  }

  private loadArabicFont() {
    if (!document.getElementById('arabicFontLink')) {
      const linkElement = document.createElement('link');
      linkElement.id = 'arabicFontLink';
      linkElement.rel = 'stylesheet';
      linkElement.href = 'https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500;700;800;900&display=swap';
      document.head.appendChild(linkElement);
    }
  }

  private removeArabicFont() {
    const linkElement = document.getElementById('arabicFontLink');
    if (linkElement) {
      document.head.removeChild(linkElement);
    }
  }

  // **Add this method**
  getTranslation(key: string): string {
    return this.translate.instant(key);
  }
}
