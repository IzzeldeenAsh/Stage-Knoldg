import { Component, Injector, OnDestroy, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { BaseComponent } from "src/app/modules/base.component";
import { AuthService } from "../../services/auth.service";
import { first } from "rxjs/operators";
import { environment } from "src/environments/environment";
import { HttpClient, HttpHeaders } from "@angular/common/http";

@Component({
  selector: "app-callback",
  templateUrl: "./callback.component.html",
  styleUrls: ["./callback.component.scss"],
})
export class CallbackComponent extends BaseComponent implements OnInit, OnDestroy {
  user: any;
  token: string | null = null;
  roles: string[] = [];
  errorMessage: string | null = null;
  isProcessing: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private http: HttpClient,
    injector: Injector
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.isProcessing = true;
    this.processCallback();
  }

  private processCallback(): void {
    // Check for token in query parameters first
    const routeSub = this.route.queryParamMap.subscribe((params) => {
      this.token = params.get("token");
      const rolesParam = params.get("roles");
      
      if (rolesParam) {
        this.roles = rolesParam.split(",").map((role) => role.trim());
      }
      
      if (this.token) {
        this.handleTokenReceived(this.token);
      } else {
        // If no token in query params, check URL path for backward compatibility
        this.route.params.subscribe(params => {
          if (params['token']) {
            this.handleTokenReceived(params['token']);
          } else {
            this.handleError("No authentication token found in callback URL.");
          }
        });
      }
    });
    
    this.unsubscribe.push(routeSub);
  }

  private handleTokenReceived(token: string): void {
    // Store the token in cookie using the auth service
    this.authService['setTokenCookie'](token);
    
    // Now get user profile and handle redirect
    this.authService.getProfile().pipe(first()).subscribe({
      next: (userData) => {
        this.handleProfileSuccess(userData);
      },
      error: (error) => {
        this.handleProfileError(error);
      }
    });
  }

  private handleProfileSuccess(userData: any): void {
    this.user = userData;
    
    // Check if user is verified
    if (!userData.verified) {
      this.router.navigate(['/auth/email-reconfirm']);
      return;
    }

    // Set user's timezone before redirecting
    this.setUserTimezone().subscribe({
      next: () => {
        console.log('Timezone set successfully');
        this.redirectBasedOnRole(userData);
      },
             error: (error: any) => {
         console.error('Failed to set timezone:', error);
         // Still redirect even if timezone setting fails
         this.redirectBasedOnRole(userData);
       }
    });
  }

  private handleProfileError(error: any): void {
    console.error('Profile fetch error:', error);
    
    if (error.status === 401) {
      this.handleError("Authentication failed. Please log in again.");
      this.authService.handleLogout().subscribe(() => {
        this.router.navigate(['/auth/login']);
      });
    } else if (error.status === 403) {
      const errorMessage = error.error?.message || '';
      // Check if it's an email verification error
      if (errorMessage.includes('verified') || errorMessage.includes('verification')) {
        this.handleError("Please verify your email address to continue.");
        this.router.navigate(['/auth/email-reconfirm']);
      } else {
        this.handleError("Access denied. Please log in again.");
        this.authService.handleLogout().subscribe(() => {
          this.router.navigate(['/auth/login']);
        });
      }
    } else {
      this.handleError("Failed to verify authentication. Please try again.");
    }
  }

  private redirectBasedOnRole(userData: any): void {
    // Check user roles and redirect accordingly
    if (userData.roles && (userData.roles.includes('admin') || userData.roles.includes('staff'))) {
      // Admin/staff users stay in the Angular app
      this.router.navigate(['/admin-dashboard']);
    } else {
      // Regular users redirect to Next.js app
      this.redirectToMainApp();
    }
  }

  private redirectToMainApp(): void {
    // Check for return URL in cookie
    const returnUrl = this.getReturnUrlFromCookie();
    
    // Build the redirect URL
    let redirectUrl = `https://knoldg.com/en/callback`;
    
    if (this.token) {
      redirectUrl += `/${this.token}`;
    }
    
    if (returnUrl) {
      redirectUrl += `?returnUrl=${encodeURIComponent(returnUrl)}`;
      // Clean up the return URL cookie
      this.clearReturnUrlCookie();
    }
    
    window.location.href = redirectUrl;
  }

  private getReturnUrlFromCookie(): string | null {
    if (typeof document === 'undefined') return null;
    
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'auth_return_url') {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  private clearReturnUrlCookie(): void {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
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

  private setUserTimezone(): any {
    try {
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      console.log('Setting user timezone:', userTimezone);
      
      // Get token from cookie
      const token = this.authService['getTokenFromCookie']();
      
      if (token) {
        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Language': 'en',
        });
        
        return this.http.post('https://api.foresighta.co/api/account/timezone/set', 
          { timezone: userTimezone }, 
          { headers }
        );
      }
      
      // Return empty observable if no token
      return new Promise(resolve => resolve(null));
    } catch (error) {
      console.error('Error setting timezone:', error);
      return new Promise(resolve => resolve(null));
    }
  }

  private handleError(message: string): void {
    this.errorMessage = message;
    this.isProcessing = false;
  }

  // Method to retry the authentication process
  retryAuth(): void {
    this.errorMessage = null;
    this.isProcessing = true;
    this.processCallback();
  }

  // Method to go back to login
  goToLogin(): void {
    this.router.navigate(['/auth/login']);
  }
}
