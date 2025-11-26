import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { locale as enLang } from './vocabs/en';
import { locale as arLang } from './vocabs/ar';
import { BehaviorSubject } from 'rxjs';
import { CookieService } from '../../utils/cookie.service';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private readonly STORAGE_KEY = 'language';

  // Initialize currentLang - will be set in constructor
  private currentLang = new BehaviorSubject<string>('en');

  constructor(
    private translate: TranslateService,
    private cookieService: CookieService
  ) {
    this.translate.addLangs(['en', 'ar']);
    this.translate.setDefaultLang('en');
    this.loadTranslations(enLang, arLang);

    // Initialize language after dependencies are available
    const initial = this.getSelectedLanguage();
    this.currentLang.next(initial);
    this.translate.use(initial);
    this.updateDirection(initial);
  }

  private loadTranslations(...locales: any[]): void {
    locales.forEach(locale => {
      this.translate.setTranslation(locale.lang, locale.data, true);
    });
  }

  /**
   * Switches language in ngx-translate, writes both to localStorage and cookie,
   * updates page dir/font, and notifies observers.
   */
  setLanguage(lang: string): void {
    if (!lang) {
      return;
    }

    // ngx-translate switch
    this.translate.use(lang);

    // persist in localStorage
    localStorage.setItem(this.STORAGE_KEY, lang);

    // persist in cookie (cross-subdomain) using centralized service
    this.cookieService.setPreferredLanguage(lang);

    // update direction/font
    this.updateDirection(lang);

    // notify subscribers
    this.currentLang.next(lang);
  }

  /** Observable for other components to react to language changes */
  onLanguageChange() {
    return this.currentLang.asObservable();
  }

  /**
   * Reads preferred language from cookie only, else 'en'
   */
  getSelectedLanguage(): string {
    try {
      const fromCookie = this.cookieService?.getPreferredLanguage();
      return fromCookie || 'en';
    } catch (error) {
      // Fallback to direct cookie reading if service not available
      return this.getCookieFallback('preferred_language') || 'en';
    }
  }

  /** Fallback cookie reading method */
  private getCookieFallback(name: string): string | null {
    if (typeof document === 'undefined') return null;

    const match = document.cookie.match(
      new RegExp('(^|; )' + name.replace(/([.*+?^${}()|[\]\\])/g, '\\$1') + '=([^;]*)')
    );
    return match ? decodeURIComponent(match[2]) : null;
  }


  /** Update HTML dir/lang attributes and load/remove Arabic font */
  private updateDirection(lang: string) {
    const html = document.documentElement;
    if (lang === 'ar') {
      html.setAttribute('dir', 'rtl');
      html.setAttribute('lang', 'ar');
      this.loadArabicFont();
      html.style.fontFamily = '"Almarai", sans-serif';
    } else {
      html.setAttribute('dir', 'ltr');
      html.setAttribute('lang', 'en');
      this.removeArabicFont();
      html.style.fontFamily = '';
    }
  }

  private loadArabicFont() {
    if (!document.getElementById('arabicFontLink')) {
      const link = document.createElement('link');
      link.id = 'arabicFontLink';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap';
      document.head.appendChild(link);
    }
  }

  private removeArabicFont() {
    const link = document.getElementById('arabicFontLink');
    if (link) {
      document.head.removeChild(link);
    }
  }

  /** Helper to instantly fetch a translation key */
  getTranslation(key: string): string {
    return this.translate.instant(key);
  }
}
