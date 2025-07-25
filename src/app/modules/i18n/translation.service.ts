import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { locale as enLang } from './vocabs/en';
import { locale as arLang } from './vocabs/ar';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TranslationService {
  private readonly COOKIE_NAME = 'preferred_language';
  private readonly COOKIE_DOMAIN = '.knoldg.com';
  private readonly COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // one year in seconds
  private readonly STORAGE_KEY = 'language';

  // Initialize currentLang from storage or cookie
  private currentLang = new BehaviorSubject<string>(this.getSelectedLanguage());

  constructor(private translate: TranslateService) {
    this.translate.addLangs(['en', 'ar']);
    this.translate.setDefaultLang('en');
    this.loadTranslations(enLang, arLang);

    const initial = this.getSelectedLanguage();
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

    // persist in cookie (cross-subdomain)
    this.setCookie(this.COOKIE_NAME, lang, {
      domain: this.COOKIE_DOMAIN,
      path: '/',
      maxAge: this.COOKIE_MAX_AGE,
      sameSite: 'Lax',
      secure: true
    });

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
    const fromCookie = this.getCookie(this.COOKIE_NAME);
    return fromCookie || 'en';
  }

  /** Utility to set a cookie with options */
  private setCookie(
    name: string,
    value: string,
    opts: { domain: string; path: string; maxAge: number; sameSite: 'Lax' | 'Strict' | 'None'; secure: boolean }
  ) {
    const parts = [
      `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
      `Domain=${opts.domain}`,
      `Path=${opts.path}`,
      `Max-Age=${opts.maxAge}`,
      `SameSite=${opts.sameSite}`
    ];
    if (opts.secure) {
      parts.push('Secure');
    }
    document.cookie = parts.join('; ');
  }

  /** Utility to read a cookie by name */
  private getCookie(name: string): string | null {
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
      html.style.fontFamily = '"Tajawal", sans-serif';
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
      link.href = 'https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500;700;800;900&display=swap';
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
