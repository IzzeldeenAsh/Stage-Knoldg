import { Component, OnInit, OnDestroy, ChangeDetectorRef, Injector } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Observable } from "rxjs";
import { first } from "rxjs/operators";
import { AuthService } from "../../services/auth.service";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslationService } from "src/app/modules/i18n/translation.service";
import { Message } from "primeng/api";
import { BaseComponent } from "src/app/modules/base.component";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent extends BaseComponent implements OnInit, OnDestroy {
  defaultAuth: any = {
    email: null,
    password: null,
  };
  
  loginForm: FormGroup;
  hasError: boolean = false;
  returnUrl: string;
  isLoading$: Observable<boolean>;
  selectedLang: string = "en";
  messages: Message[] = [];
  isRTL: boolean = false;
  passwordVisible: boolean = false;
  showFullLoader: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private translationService: TranslationService,
    injector: Injector
  ) {
    super(injector);
    this.isLoading$ = this.authService.isLoading$;
    this.selectedLang = this.translationService.getSelectedLanguage();
    this.isRTL = this.selectedLang === "ar";
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.scrollAnims.scrollAnimations();
    }, 100);
  }

  getHomeUrl(): string {
    return `${environment.mainAppUrl}/${this.lang}`;
  }

  ngOnInit(): void {
    this.initForm();
    
    // Get return URL from route parameters
    this.returnUrl = this.route.snapshot.queryParams["returnUrl"] || "/";
    
    console.log('Login component initialized with returnUrl:', this.returnUrl);

    // Subscribe to language changes
    this.translationService.onLanguageChange().subscribe((lang) => {
      this.selectedLang = lang;
      this.isRTL = lang === "ar";
    });
  }

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
          Validators.maxLength(320),
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
    this.showFullLoader = true;
    this.performSocialAuth('google');
  }

  signInWithLinkedIn(event: Event): void {
    event.preventDefault();
    this.showFullLoader = true;
    this.performSocialAuth('linkedin');
  }

  private performSocialAuth(provider: 'google' | 'linkedin'): void {
    const returnUrl = this.getReturnUrl();
    
    // Store return URL in cookie
    this.setReturnUrlCookie(returnUrl);
    
    const authMethod = provider === 'google' 
      ? this.authService.getGoogleAuthRedirectUrl()
      : this.authService.getLinkedInAuthRedirectUrl();

    authMethod.subscribe({
      next: (redirectUrl) => {
        window.location.href = redirectUrl;
      },
      error: (err) => {
        console.error(`Error getting ${provider} auth redirect URL`, err);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: `Failed to initiate ${provider} sign-in.` 
        });
        this.showFullLoader = false;
      }
    });
  }

  togglePasswordVisibility(passwordField: HTMLInputElement): void {
    this.passwordVisible = !this.passwordVisible;
    passwordField.type = this.passwordVisible ? "text" : "password";
  }
  
  private getReturnUrl(): string {
    let returnUrl = this.returnUrl !== "/" ? this.returnUrl : document.referrer;
    
    // Check if returnUrl is a full URL from allowed domains
    if (returnUrl && (returnUrl.includes('foresighta.co') || returnUrl.includes('localhost'))) {
      return returnUrl;
    }
    
    // Don't return to login or auth pages
    if (!returnUrl || returnUrl === "/" || returnUrl.includes("/login") || returnUrl.includes("/auth/")) {
      return "/";
    }
    
    return returnUrl;
  }
  
  submit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.hasError = false;
    this.messages = [];
    this.showFullLoader = true;

    const returnUrl = this.getReturnUrl();
    
    const loginSubscr = this.authService
      .login(this.f.email.value, this.f.password.value, this.selectedLang, returnUrl)
      .pipe(first())
      .subscribe({
        next: (loginResponse) => {
          this.handleLoginSuccess(loginResponse.userData, loginResponse.token);
        },
        error: (error) => {
          this.handleLoginError(error);
        },
      });
    
    this.unsubscribe.push(loginSubscr);
  }

  private handleLoginSuccess(userData: any, token: string): void {
    console.log('Login successful for user:', userData.email, 'with token:', token.substring(0, 20) + '...');
    
    // Check if user needs email verification
    if (userData.verified === false) {
      this.showFullLoader = false;
      this.router.navigate(["/auth/email-reconfirm"]);
      return;
    }

    // Check user roles and redirect accordingly
    if (userData.roles && (userData.roles.includes("admin") || userData.roles.includes("staff"))) {
      // Admin/staff users stay in the Angular app
      this.router.navigate(["/admin-dashboard"]);
    } else {
      // Regular users redirect to Next.js app
      this.redirectToMainApp(token);
    }
  }

  private handleLoginError(error: any): void {
    this.hasError = true;
    this.messages = [];
    this.showFullLoader = false;

    if (error.validationMessages) {
      this.messages = error.validationMessages;
    } else if (error.error?.message === 'Your email address is not verified.') {
      this.router.navigate(['/auth/email-reconfirm']);
    } else {
      this.messages.push({
        severity: "error",
        summary: "Authentication Error",
        detail: error.error?.message || "An unexpected error occurred.",
      });
    }
  }

  private redirectToMainApp(token: string): void {
    const returnUrl = this.getReturnUrl();
    
    console.log('Redirecting to Next.js with token:', token.substring(0, 20) + '...', 'and returnUrl:', returnUrl);
    
    // Build the redirect URL with token
    let redirectUrl = `${environment.mainAppUrl}/en/callback/${token}`;
    
    // Add return URL as query parameter if it exists
    if (returnUrl && returnUrl !== '/') {
      redirectUrl += `?returnUrl=${encodeURIComponent(returnUrl)}`;
    }
    
    console.log('Final redirect URL:', redirectUrl);
    
    // Add a small delay to ensure any pending operations complete
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 100);
  }

  private setReturnUrlCookie(url: string): void {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    let cookieSettings;
    if (isLocalhost) {
      cookieSettings = [
        `auth_return_url=${encodeURIComponent(url)}`,
        `Path=/`,
        `Max-Age=${60 * 60}`, // 1 hour
        `SameSite=Lax`
      ];
    } else {
      cookieSettings = [
        `auth_return_url=${encodeURIComponent(url)}`,
        `Path=/`,
        `Max-Age=${60 * 60}`, // 1 hour
        `SameSite=None`,
        `Domain=.foresighta.co`,
        `Secure`
      ];
    }
    
    document.cookie = cookieSettings.join('; ');
  }
}
