import { Component, OnInit, OnDestroy, ChangeDetectorRef, Injector } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Observable } from "rxjs";
import { first } from "rxjs/operators";
import { AuthService } from "../../services/auth.service";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslationService } from "src/app/modules/i18n/translation.service";
import { Message } from "primeng/api";
import {BaseComponent} from "src/app/modules/base.component"
import { environment } from "src/environments/environment";
@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent extends BaseComponent implements OnInit, OnDestroy {
  // KeenThemes mock, change it to:
  defaultAuth: any = {
    email: null,
    password: null,
  };
  loginForm: FormGroup;
  hasError: boolean;
  returnUrl: string;
  isLoading$: Observable<boolean>;
  selectedLang: string = "en";
  messages: Message[] = []; // Array to hold error messages
  isRTL: boolean = false; // Added for RTL logic
  passwordVisible: boolean = false;
  // private fields

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private translationService: TranslationService,
    injector: Injector
  ) {
    super(injector);
    // Now you can use someOtherService alongside base services
    this.isLoading$ = this.authService.isLoading$;
    this.selectedLang = this.translationService.getSelectedLanguage();
    this.isRTL = this.selectedLang === "ar"; // Set RTL based on the selected language
  }
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.scrollAnims.scrollAnimations();
    }, 100); // Delay to ensure DOM elements are fully loaded
  }

  getHomeUrl(): string {
    const url= 'https://knoldg.com/' + this.lang;
    return url;
  }

  ngOnInit(): void {

    this.initForm();
    // get return url from route parameters or default to '/'
    this.returnUrl =
      this.route.snapshot.queryParams["returnUrl".toString()] || "/";

    this.translationService.onLanguageChange().subscribe((lang) => {
      this.selectedLang = lang;
    });
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.loginForm.controls;
  }

  initForm() {
    this.loginForm = this.fb.group({
      email: [
        this.defaultAuth.email,
        Validators.compose([
          Validators.required,
          Validators.email,
          Validators.minLength(3),
          Validators.maxLength(320), // https://stackoverflow.com/questions/386294/what-is-the-maximum-length-of-a-valid-email-address
        ]),
      ],
      password: [
        this.defaultAuth.password,
        Validators.compose([
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ]),
      ],
    });
  }

  signInWithGoogle(event: Event): void {
    event.preventDefault();
    // Store return URL in a cross-domain cookie before redirecting
    const prevUrl = this.getReturnUrl();
    this.setReturnUrlCookie(prevUrl);
    
    this.authService.getGoogleAuthRedirectUrl().subscribe({
      next: (redirectUrl) => {
        const authtoken:any = localStorage.getItem('foresighta-creds');
        const token = JSON.parse(authtoken);
        if (token && token.authToken) {
          // Store token in Next.js format for better compatibility
          localStorage.setItem('token', token.authToken);
          // Use the imported environment variable for the main app URL with returnUrl as query param
          window.location.href = `${environment.mainAppUrl}/en/callback/${token.authToken}?returnUrl=${encodeURIComponent(prevUrl)}`;
        } else {
          window.location.href = redirectUrl;
        }
      },
      error: (err) => {
        console.error('Error getting Google auth redirect URL', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to initiate Google sign-in.' });
      }
    });
  }

  signInWithLinkedIn(event: Event): void {
    event.preventDefault();
    // Store return URL in a cross-domain cookie before redirecting
    const prevUrl = this.getReturnUrl();
    this.setReturnUrlCookie(prevUrl);
    
    this.authService.getLinkedInAuthRedirectUrl().subscribe({
      next: (redirectUrl) => {
        const authtoken:any = localStorage.getItem('foresighta-creds');
        const token = JSON.parse(authtoken);
        if (token && token.authToken) {
          // Store token in Next.js format for better compatibility
          localStorage.setItem('token', token.authToken);
          // Use the imported environment variable for the main app URL with returnUrl as query param
          window.location.href = `${environment.mainAppUrl}/en/callback/${token.authToken}?returnUrl=${encodeURIComponent(prevUrl)}`;
        } else {
          window.location.href = redirectUrl;
        }
      },
      error: (err) => {
        console.error('Error getting LinkedIn auth redirect URL', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to initiate LinkedIn sign-in.' });
      }
    });
  }

  togglePasswordVisibility(passwordField: HTMLInputElement): void {
    this.passwordVisible = !this.passwordVisible;
    passwordField.type = this.passwordVisible ? "text" : "password";
  }
  
  // Get the URL to return to after login
  private getReturnUrl(): string {
    // Use the return URL from route params or document.referrer if available
    let returnUrl = this.returnUrl !== "/" ? this.returnUrl : document.referrer;
    
    // Check if returnUrl is a full URL from knoldg.com
    if (returnUrl && (returnUrl.includes('knoldg.com') || returnUrl.includes('localhost'))) {
      // Keep full URLs from knoldg.com domains or localhost
      return returnUrl;
    }
    
    // Don't return to login or auth pages
    if (!returnUrl || returnUrl === "/" || returnUrl.includes("/login") || returnUrl.includes("/auth/")) {
      return "/";
    }
    
    return returnUrl;
  }
  
  submit() {
    this.hasError = false;

    const loginSubscr = this.authService
      .login(this.f.email.value, this.f.password.value, this.selectedLang ? this.selectedLang : 'en')
      .pipe(first())
      .subscribe({
        next: (res) => {
          if (res && res?.roles) {
            if (res.roles.includes("admin") || res.roles.includes("staff")) {
              // Admin/staff users stay in the Angular app
              this.router.navigate(["/admin-dashboard"]);
            } else {
              // For regular users, ensure token is properly stored before redirecting
              try {
                const authtoken = localStorage.getItem('foresighta-creds');
                if (!authtoken) {
                  throw new Error('Auth token not found');
                }
                
                const token = JSON.parse(authtoken);
                if (!token || !token.authToken) {
                  throw new Error('Invalid auth token format');
                }
                
                // Ensure token is also stored in Next.js format
                localStorage.setItem('token', token.authToken);
                
                // Set token in cookie for SSR functions
                this.setAuthCookie(token.authToken);
                
                // Get the return URL and redirect to Next.js callback with it as a query param
                const prevUrl = this.getReturnUrl();
                window.location.href = `${environment.mainAppUrl}/en/callback/${token.authToken}?returnUrl=${encodeURIComponent(prevUrl)}`;
              } catch (err) {
                console.error('Error processing auth token:', err);
                this.messages.push({
                  severity: "error",
                  summary: "Authentication Error",
                  detail: "There was a problem with your login. Please try again.",
                });
              }
            }
          }
        },
        error: (error) => {
          this.messages = [];

          // Check if the error contains validation messages
          if (error.validationMessages) {
            this.messages = error.validationMessages; // Set the messages array
          } else {
            this.messages.push({
              severity: "error",
              summary: "Error",
              detail: "An unexpected error occurred.",
            });
          }
        },
      });
    this.unsubscribe.push(loginSubscr);
  }
  
  private setAuthCookie(token: string): void {
    // Set token in a cookie with proper cross-domain settings
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Build cookie settings based on environment
    let cookieSettings;
    
    if (isLocalhost) {
      // For localhost: Use Lax SameSite without Secure flag
      cookieSettings = [
        `token=${token}`,
        `Path=/`,               // send on all paths
        `Max-Age=${60 * 60 * 24}`, // expires in 24 hours
        `SameSite=Lax`          // default value, works on same site
      ];
    } else {
      // For production: Use None SameSite with Secure flag and domain
      cookieSettings = [
        `token=${token}`,
        `Path=/`,
        `Max-Age=${60 * 60 * 24}`,
        `SameSite=None`,        // works across domains
        `Domain=.knoldg.com`,   // leading dot = include subdomains
        `Secure`                // HTTPS only
      ];
    }
    
    document.cookie = cookieSettings.join('; ');
  }

  // Helper to set cross-domain cookie for return URL
  private setReturnUrlCookie(url: string): void {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    // Build cookie settings based on environment
    let cookieSettings;
    
    if (isLocalhost) {
      // For localhost: Use Lax SameSite without Secure flag
      cookieSettings = [
        `auth_return_url=${encodeURIComponent(url)}`,
        `Path=/`,               // send on all paths
        `Max-Age=${60 * 60}`,   // expires in 1 hour
        `SameSite=Lax`          // default value, works on same site
      ];
    } else {
      // For production: Use None SameSite with Secure flag and domain
      cookieSettings = [
        `auth_return_url=${encodeURIComponent(url)}`,
        `Path=/`,
        `Max-Age=${60 * 60}`,   // expires in 1 hour
        `SameSite=None`,        // works across domains
        `Domain=.knoldg.com`,   // leading dot = include subdomains
        `Secure`                // HTTPS only
      ];
    }
    
    document.cookie = cookieSettings.join('; ');
  }
}
