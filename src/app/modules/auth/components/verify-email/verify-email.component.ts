import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { BaseComponent } from "src/app/modules/base.component";
import { ScrollAnimsService } from "src/app/_fake/services/scroll-anims/scroll-anims.service";

@Component({
  selector: "app-verify-email",
  templateUrl: "./verify-email.component.html",
  styleUrls: ["./verify-email.component.scss"],
})
export class VerifyEmailComponent extends BaseComponent implements OnInit {
  afterBasePath: string = "";
  resendErrorMessage: string = "";
  resendSuccessMessage: string = "";
  verificationStatus: string = "Verifying your email!";
  errorMessage: string = "";
  error: boolean = false;
  loading: boolean = true;

  private insightaHost: string = "https://api.4sighta.com";
  verified: boolean = false;
  showSignUpButton: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    scrollAnims: ScrollAnimsService,
    private router: Router
  ) {
    super(scrollAnims);
  }

  ngOnInit(): void {
    this.verify();
  }

  verify() {
    this.showSignUpButton = false;
    this.error = false;
    this.loading = true; // Ensure loading is true at the start

    this.route.queryParamMap.subscribe((paramMap) => {
      let paramsValue = paramMap.get("params");

      if (!paramsValue) {
        this.verificationStatus = "Invalid verification link.";
        this.errorMessage = "The verification link is invalid.";
        this.error = true;
        this.loading = false;
        return;
      }

      const splitParams = paramsValue.split("?");
      const mainParams = splitParams[0];
      let expires = "";

      if (splitParams.length > 1) {
        const subParams = new URLSearchParams(splitParams[1]);
        expires = subParams.get("expires") || "";
      }

      if (!expires) {
        expires = paramMap.get("expires") || "";
      }

      if (!expires) {
        this.verificationStatus = "Link expired.";
        this.errorMessage = "The verification link has expired.";
        this.error = true;
        this.loading = false;
        return;
      }

      const expiresTimestamp = Number(expires);
      if (isNaN(expiresTimestamp)) {
        this.verificationStatus = "Invalid expiration parameter.";
        this.errorMessage =
          "The verification link has an invalid expiration parameter.";
        this.error = true;
        this.loading = false;
        return;
      }

      const currentTimestamp = Math.floor(Date.now() / 1000);

      if (currentTimestamp > expiresTimestamp) {
        this.verificationStatus = "Link has expired.";
        this.errorMessage = "The verification link has expired.";
        this.error = true;
        this.loading = false;
        return;
      }

      const apiUrl = `${this.insightaHost}/api/account/email/${paramsValue}`;

      console.log("API URL:", apiUrl);

      this.http.get(apiUrl).subscribe({
        next: (response: any) => {
          this.verificationStatus = "Email successfully verified!";
          this.verified = true;
          this.loading = false; // Ensure loading is false after success
          console.log("Verification Response:", response);
        },
        error: (error: HttpErrorResponse) => {
          console.error("Verification Error:", error);
          if (error.status === 400) {
            this.errorMessage = "Invalid or expired verification link.";
          } else {
            this.errorMessage =
              "An unexpected error occurred. Please try again later.";
          }
          this.verificationStatus = "Verification failed.";
          this.error = true;
          this.loading = false; // Ensure loading is false after error
        },
      });
    });
  }

  resend() {
    this.loading = true;
    this.resendErrorMessage = "";
    this.resendSuccessMessage = "";
    this.error = false;
    this.showSignUpButton = false;
    const resendApiUrl = `${this.insightaHost}/api/account/email/resend`;

    this.http.post(resendApiUrl, {}).subscribe({
      next: (response: any) => {
        this.verificationStatus =
          "A new verification email has been sent to your email address.";
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error("Resend Verification Error:", error);
        if (error.status === 400) {
          this.resendErrorMessage = "Please try again later.";
        } else if (error.status === 401) {
          this.showSignUpButton = true;
          this.resendErrorMessage = "Your session has expired. Please sign up again.";
        } else {
          this.resendErrorMessage = "Please try again later.";
        }
        this.loading = false;
      },
    });
  }

  toApp() {
    this.router.navigateByUrl("/");
  }
  signuppath() {
    this.router.navigateByUrl("/auth/sign-up");
  }
}
