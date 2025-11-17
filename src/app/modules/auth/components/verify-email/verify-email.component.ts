  import { Component, OnInit, OnDestroy, Injector } from "@angular/core";
  import { ActivatedRoute, Params, Router } from "@angular/router";
  import { HttpClient, HttpErrorResponse, HttpHeaders } from "@angular/common/http";
  import { BaseComponent } from "src/app/modules/base.component";
  import { Subscription } from 'rxjs';
  import { TranslationService } from "src/app/modules/i18n";


  @Component({
    selector: "app-verify-email",
    templateUrl: "./verify-email.component.html",
    styleUrls: ["./verify-email.component.scss"],
  })
  export class VerifyEmailComponent extends BaseComponent implements OnInit, OnDestroy {
    afterBasePath: string = "";
    verificationStatusKey: string = '';
    verificationStatus: string = '';

    errorMessageKey: string = '';
    errorMessage: string = '';

    resendErrorMessageKey: string = '';
    resendErrorMessage: string = '';

    error: boolean = false;
    loading: boolean = true;

    private insightaHost: string = "https://api.foresigha.co";
    verified: boolean = false;
    showSignUpButton: boolean = false;

    private langChangeSubscription: Subscription;

    constructor(
      private route: ActivatedRoute,
      private http: HttpClient,
      private router: Router,
      private translationService: TranslationService,
      injector: Injector
    ) {
      super(injector);
    }

    ngOnInit(): void {
      this.verificationStatusKey = 'AUTH.VERIFY_EMAIL.VERIFYING_EMAIL';
      this.verificationStatus = this.translationService.getTranslation(this.verificationStatusKey);
      this.verify();

      // Subscribe to language changes
      this.langChangeSubscription = this.translationService.onLanguageChange().subscribe(() => {
        this.updateTranslations();
      });
    }

    ngOnDestroy() {
      if (this.langChangeSubscription) {
        this.langChangeSubscription.unsubscribe();
      }
      
      if (this.routeSubscription) {
        this.routeSubscription.unsubscribe();
      }
    }

    updateTranslations() {
      if (this.verificationStatusKey) {
        this.verificationStatus = this.translationService.getTranslation(this.verificationStatusKey);
      }
      if (this.errorMessageKey) {
        this.errorMessage = this.translationService.getTranslation(this.errorMessageKey);
      }
      if (this.resendErrorMessageKey) {
        this.resendErrorMessage = this.translationService.getTranslation(this.resendErrorMessageKey);
      }
    }
    private routeSubscription: Subscription;

  verify() {
      this.showSignUpButton = false;
      this.error = false;
      this.loading = true;

      // Store the subscription to unsubscribe later
      if (this.routeSubscription) {
        this.routeSubscription.unsubscribe();
      }
      
      this.routeSubscription = this.route.queryParamMap.subscribe((paramMap) => {
        let paramsValue = paramMap.get("params");

        if (!paramsValue) {
          this.verificationStatusKey = 'AUTH.VERIFY_EMAIL.INVALID_VERIFICATION_LINK';
          this.verificationStatus = this.translationService.getTranslation(this.verificationStatusKey);

          this.errorMessageKey = 'AUTH.VERIFY_EMAIL.VERIFICATION_LINK_INVALID';
          this.errorMessage = this.translationService.getTranslation(this.errorMessageKey);

          this.error = true;
          this.loading = false;
          return;
        }

        const apiUrl = `${this.insightaHost}/api/account/email/verify/${paramsValue}`;

        const headers = new HttpHeaders({
          'Accept': 'application/json',
          'Accept-Language': 'en'
        });

        this.http.get(apiUrl, { headers }).subscribe({
          next: (response: any) => {
            // Redirect to the callback URL with the token from cookies
            const token = this.getTokenFromCookie();
            window.location.href = `https://foresigha.co/en/callback/${token}`;
            this.verificationStatusKey = 'AUTH.VERIFY_EMAIL.EMAIL_SUCCESSFULLY_VERIFIED';
            this.verificationStatus = this.translationService.getTranslation(this.verificationStatusKey);
            this.verified = true;
            this.loading = false;

    
          },
          error: (error: HttpErrorResponse) => {
            console.error("Verification Error:", error);
            
            if (error.status === 401) {
              // Handle unauthorized error - redirect to login page
              localStorage.removeItem("foresighta-creds");
              localStorage.removeItem("currentUser");
              localStorage.removeItem("authToken");
              localStorage.removeItem("token");
              this.router.navigateByUrl("/auth/login");
              return;
            }
            
            if (error.status === 400) {
              this.errorMessageKey = 'AUTH.VERIFY_EMAIL.INVALID_OR_EXPIRED_VERIFICATION_LINK';
              this.errorMessage = this.translationService.getTranslation(this.errorMessageKey);
            } else {
              this.errorMessageKey = 'AUTH.VERIFY_EMAIL.UNEXPECTED_ERROR';
              this.errorMessage = this.translationService.getTranslation(this.errorMessageKey);
            }
            this.verificationStatusKey = 'AUTH.VERIFY_EMAIL.VERIFICATION_FAILED';
            this.verificationStatus = this.translationService.getTranslation(this.verificationStatusKey);
            localStorage.removeItem("foresighta-creds");
            localStorage.removeItem("currentUser");
            localStorage.removeItem("authToken");
            localStorage.removeItem("token");
            this.error = true;
            this.loading = false;
          },
        });
      });
    }

    signup() {
      this.router.navigateByUrl("/auth/login");
    }

    toApp() {
      // After successful verification, redirect to the callback route
      // which will handle the proper authentication flow
      const token = this.getTokenFromCookie();
      if (token) {
        this.router.navigate(['/auth/callback'], { queryParams: { token: token } });
      } else {
        // If no token, redirect to login
        this.router.navigate(['/auth/login']);
      }
    }

    signuppath() {
      this.router.navigateByUrl("/auth/sign-up");
    }

    private getTokenFromCookie(): string | null {
      if (typeof document === 'undefined') return null;
      
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'token') {
          return value;
        }
      }
      return null;
    }
  }
