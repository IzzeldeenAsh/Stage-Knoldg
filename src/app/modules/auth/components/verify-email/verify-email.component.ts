import { Component, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { BaseComponent } from "src/app/modules/base.component";
import { ScrollAnimsService } from "src/app/_fake/services/scroll-anims/scroll-anims.service";
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

  private insightaHost: string = "https://api.4sighta.com";
  verified: boolean = false;
  showSignUpButton: boolean = false;

  private langChangeSubscription: Subscription;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    scrollAnims: ScrollAnimsService,
    private router: Router,
    private translationService: TranslationService
  ) {
    super(scrollAnims);
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

  verify() {
    this.showSignUpButton = false;
    this.error = false;
    this.loading = true;

    this.route.queryParamMap.subscribe((paramMap) => {
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

      // ... rest of your verification logic, storing keys and messages ...

      const apiUrl = `${this.insightaHost}/api/account/email/verify/${paramsValue}`;

      console.log("API URL:", apiUrl);

      this.http.get(apiUrl).subscribe({
        next: (response: any) => {
          this.verificationStatusKey = 'AUTH.VERIFY_EMAIL.EMAIL_SUCCESSFULLY_VERIFIED';
          this.verificationStatus = this.translationService.getTranslation(this.verificationStatusKey);

          this.verified = true;
          this.loading = false;
          console.log("Verification Response:", response);
        },
        error: (error: HttpErrorResponse) => {
          console.error("Verification Error:", error);
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
          this.error = true;
          this.loading = false;
        },
      });
    });
  }

  resend() {
    this.loading = true;
    this.resendErrorMessageKey = '';
    this.resendErrorMessage = '';
    this.error = false;
    this.showSignUpButton = false;
    const resendApiUrl = `${this.insightaHost}/api/account/email/resend`;

    this.http.post(resendApiUrl, {}).subscribe({
      next: (response: any) => {
        this.verificationStatusKey = 'AUTH.VERIFY_EMAIL.NEW_VERIFICATION_EMAIL_SENT';
        this.verificationStatus = this.translationService.getTranslation(this.verificationStatusKey);
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error("Resend Verification Error:", error);
        if (error.status === 400) {
          this.resendErrorMessageKey = 'AUTH.VERIFY_EMAIL.PLEASE_TRY_AGAIN_LATER';
          this.resendErrorMessage = this.translationService.getTranslation(this.resendErrorMessageKey);
        } else if (error.status === 401) {
          this.showSignUpButton = true;
          this.resendErrorMessageKey = 'AUTH.VERIFY_EMAIL.SESSION_EXPIRED_SIGN_UP_AGAIN';
          this.resendErrorMessage = this.translationService.getTranslation(this.resendErrorMessageKey);
        } else {
          this.resendErrorMessageKey = 'AUTH.VERIFY_EMAIL.PLEASE_TRY_AGAIN_LATER';
          this.resendErrorMessage = this.translationService.getTranslation(this.resendErrorMessageKey);
        }
        this.loading = false;
      },
    });
  }

  toApp() {
    this.router.navigateByUrl("/app");
  }

  signuppath() {
    this.router.navigateByUrl("/auth/sign-up");
  }
}
