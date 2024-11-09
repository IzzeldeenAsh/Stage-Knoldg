// verify-email.component.ts
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

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    scrollAnims: ScrollAnimsService,
    private router :Router
  ) {
    super(scrollAnims);
  }

  ngOnInit(): void {
    this.verify();
  }

  verify() {
    this.error = false;
    this.route.queryParamMap.subscribe((paramMap) => {
      let paramsValue = paramMap.get("params");
      const signature = paramMap.get("signature");

      if (!paramsValue || !signature) {
        this.verificationStatus = "Invalid verification link.";
        this.error = true;
        this.loading = false;
        return;
      }

      const splitParams = paramsValue.split("?");
      const mainParams = splitParams[0]; // '3/e7e5a4d25faf55663a8267582a53294b856832b2'
      let expires = "";

      if (splitParams.length > 1) {
        // Extract 'expires' from the split
        const subParams = new URLSearchParams(splitParams[1]);
        expires = subParams.get("expires") || "";
      }

      // If 'expires' was not in 'params', try to get it as a separate query param
      if (!expires) {
        expires = paramMap.get("expires") || "";
      }

      if (!expires) {
        this.verificationStatus = "Link expired.";
        this.error = true;
        return;
      }
      // Convert 'expires' to a number (assuming it's a Unix timestamp in seconds)
      const expiresTimestamp = Number(expires);
      if (isNaN(expiresTimestamp)) {
        this.verificationStatus = "Invalid expiration parameter.";
        this.error = true;
        this.loading = false;
        return;
      }

      // Get current time in seconds
      const currentTimestamp = Math.floor(Date.now() / 1000);

      if (currentTimestamp > expiresTimestamp) {
        this.verificationStatus = "Link has expired.";
        this.error = true;
        this.loading = false;
        return;
      }
      // Construct the API URL
      const apiUrl = `${this.insightaHost}/api/account/email/${mainParams}?expires=${expires}&signature=${signature}`;

      console.log("API URL:", apiUrl);

      // Make the HTTP GET request to verify the email
      this.http.get(apiUrl).subscribe({
        next: (response: any) => {
          // Handle successful verification
          this.verificationStatus = "Email successfully verified!";
          console.log("Verification Response:", response);
        },
        error: (error: HttpErrorResponse) => {
          // Handle errors
          console.error("Verification Error:", error);
          if (error.status === 400) {
            this.errorMessage = "Invalid or expired verification link.";
          } else {
            this.errorMessage =
              "An unexpected error occurred. Please try again later.";
          }
          this.verificationStatus = "Verification failed.";
        },
      });
    });
  }

  resend() {
    this.loading = true;
    this.resendErrorMessage = "";
    this.resendSuccessMessage = "";
    this.error = false;

    const resendApiUrl = `${this.insightaHost}/api/account/email/resend`;

    this.http.post(resendApiUrl, {}).subscribe({
      next: (response: any) => {
        // Handle successful resend
        this.verificationStatus =
          "A new verification email has been sent to your email address.";
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        // Handle errors
        this.error = true;
        console.error("Resend Verification Error:", error);
        if (error.status === 400) {
          this.resendErrorMessage =
            "The provided email address is invalid or already verified.";
        } else {
          this.resendErrorMessage = "Please try again later.";
        }
        this.loading = false;
      },
    });
  }

  toApp() {
    this.router.navigateByUrl('/')
  }
}
