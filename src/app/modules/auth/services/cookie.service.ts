import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CookieService {
  constructor() { }

  /**
   * Set a cookie with the specified properties
   */
  setCookie(name: string, value: string, expirationDays: number = 30, path: string = '/'): void {
    const date = new Date();
    date.setTime(date.getTime() + (expirationDays * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    
    // Use domain from environment config
    const domain = environment.cookieOptions.domain;
    
    // Cross-domain cookies must be secure when SameSite=None
    const secure = '; secure';
    
    // Cross-domain cookies need SameSite=None 
    const sameSite = '; SameSite=None';
    
    document.cookie = `${name}=${value}; ${expires}; path=${path}; domain=${domain}${secure}${sameSite}`;
  }

  /**
   * Get cookie value by name
   */
  getCookie(name: string): string | null {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName === name) {
        return cookieValue;
      }
    }
    return null;
  }

  /**
   * Delete a cookie by name
   */
  deleteCookie(name: string, path: string = '/'): void {
    // To delete a cookie, set its expiration date to the past
    const domain = environment.cookieOptions.domain;
    
    // Cross-domain cookies must be secure when SameSite=None
    const secure = '; secure';
    
    // Cross-domain cookies need SameSite=None
    const sameSite = '; SameSite=None';
    
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}${secure}${sameSite}`;
  }
} 