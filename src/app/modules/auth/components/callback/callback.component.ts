import { Component, Injector, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { BaseComponent } from "src/app/modules/base.component";
import { ProductionCookieService } from "../production-login/production-cookie.service";
import { TranslationService } from "src/app/modules/i18n/translation.service";

@Component({
  selector: "app-callback",
  templateUrl: "./callback.component.html",
  styleUrls: ["./callback.component.scss"],
})
export class CallbackComponent extends BaseComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private productionCookieService: ProductionCookieService,
    private translationService: TranslationService,
    injector: Injector
  ) {
    super(injector);
  }

  ngOnInit(): void {
    // Fast processing - no loaders, immediate redirect
    this.processCallback();
  }

  private processCallback(): void {
    // Get token from query parameters
    this.route.queryParamMap.subscribe((params) => {
      const token = params.get("token");
      const rolesParam = params.get("roles");
      const roles = rolesParam ? rolesParam.split(",").map((role) => role.trim()) : [];
      
      if (token) {
        // Store token in cookie with .foresighta.co domain
        this.productionCookieService.setAuthToken(token);
        
        // Store preferred language
        const currentLang = this.translationService.getSelectedLanguage();
        this.productionCookieService.setPreferredLanguage(currentLang);
        
        // Get return URL from cookie
        const returnUrl = this.getReturnUrlFromCookie();
        
        // Clean up return URL cookie
        if (returnUrl) {
          this.clearReturnUrlCookie();
        }
        
        // Immediately redirect based on roles
        this.redirectBasedOnRole(roles, returnUrl);
      } else {
        // No token - redirect to login
        console.error('[callback] No token found in URL');
        window.location.href = 'https://app.foresighta.co/auth/login';
      }
    });
  }

  private redirectBasedOnRole(roles: string[], returnUrl: string | null): void {
    const currentLang = this.translationService.getSelectedLanguage() || 'en';
    
    // Check if user is admin/staff - stay in Angular app
    if (roles.includes('admin') || roles.includes('staff')) {
      this.router.navigate(['/admin-dashboard']);
      return;
    }
    
    // Regular users redirect to Next.js app
    // If returnUrl exists and is valid, redirect there
    if (returnUrl) {
      try {
        const returnUrlObj = new URL(returnUrl);
        const allowedDomains = ['foresighta.co', 'www.foresighta.co', 'app.foresighta.co', 'localhost'];
        const isAllowed = allowedDomains.some(domain => 
          returnUrlObj.hostname === domain || 
          returnUrlObj.hostname.endsWith(`.${domain}`) ||
          returnUrlObj.hostname.startsWith('localhost:') ||
          returnUrlObj.hostname.startsWith('127.0.0.1:')
        );
        
        if (isAllowed) {
          window.location.href = returnUrl;
          return;
        }
      } catch (e) {
        console.error('[callback] Invalid returnUrl:', e);
      }
    }
    
    // Default redirect to Next.js app home
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.startsWith('localhost:') ||
                       window.location.hostname.startsWith('127.0.0.1:');
    
    if (isLocalhost) {
      window.location.href = `https://foresighta.co/${currentLang}/home`;
    } else {
      window.location.href = `https://www.foresighta.co/${currentLang}/home`;
    }
  }

  private getReturnUrlFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'auth_return_url') {
        try {
          return decodeURIComponent(value);
        } catch (e) {
          return value;
        }
      }
    }
    return null;
  }

  private clearReturnUrlCookie(): void {
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.startsWith('localhost:') ||
                       window.location.hostname.startsWith('127.0.0.1:');
    
    let cookieSettings;
    if (isLocalhost) {
      cookieSettings = [
        'auth_return_url=',
        'Path=/',
        'Max-Age=-1'
      ];
    } else {
      cookieSettings = [
        'auth_return_url=',
        'Path=/',
        'Max-Age=-1',
        'SameSite=None',
        'Domain=.foresighta.co',
        'Secure'
      ];
    }
    
    document.cookie = cookieSettings.join('; ');
  }
}
