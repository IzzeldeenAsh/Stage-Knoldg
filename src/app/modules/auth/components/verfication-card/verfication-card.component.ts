import { ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Observable, Subscription, Subject, timer, of } from "rxjs";
import { CheckCodeEmailService } from "src/app/_fake/services/check-code/check-code-email.service";
import { HttpClient } from '@angular/common/http';

@Component({
  selector: "app-verfication-card",
  templateUrl: "./verfication-card.component.html",
  styleUrls: ["./verfication-card.component.scss"],
})
export class VerficationCardComponent implements OnInit, OnDestroy {
  email: string = "****@email.com";
  code: string = "";
  hasError: boolean = false;
  private unsubscribe: Subscription[] = [];
  isLoading$: Observable<boolean>;

  isResendDisabled: boolean = false;
  resendCountdown$: Subject<number| null> = new Subject<number | null>();
  message: string = '';
  messageType: 'success' | 'error' = 'success';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private _checkCode: CheckCodeEmailService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {
    this.isLoading$ = of(false); // Initialize loading state
  }

  ngOnInit(): void {
    this.getEmail();
  }

  resetError() {
    this.hasError = false;
    this.cdr.detectChanges();
  }

  getEmail() {
    const email = this.route.snapshot.paramMap.get("email");
    if (email) {
      this.email = email;
    } else {
      this.router.navigate(["/auth/registration"]);
    }
  }

  submitCode() {
    this.hasError = false;
    const verifySub = this._checkCode
      .checkEmailcode(this.email, this.code)
      .subscribe({
        next: (res) => {
          if (res.state == false) {
            this.hasError = true;
            this.cdr.detectChanges();
          } else {
            this.router.navigate(['/auth/wait']);
          }
        },
        error: (err) => {
          this.hasError = true;
          this.cdr.detectChanges();
        },
      });
    this.unsubscribe.push(verifySub);
  }

  onResendClick(): void {
    if (this.isResendDisabled) return;

    this.resendVerificationEmail();
    this.startResendCooldown();
  }

  startResendCooldown(): void {
    this.isResendDisabled = true;
    const countdownTime = 30; // seconds

    const timerSub = timer(0, 1000).subscribe(elapsedTime => {
      const remainingTime = countdownTime - elapsedTime;
      if (remainingTime >= 0) {
        this.resendCountdown$.next(remainingTime);
      } else {
        this.resendCountdown$.next(null);
        this.isResendDisabled = false;
        timerSub.unsubscribe();
      }
    });

    this.unsubscribe.push(timerSub);
  }

  resendVerificationEmail(): void {
    this.isLoading$ = of(true);
    const resendSub = this._checkCode.resendEmailCode(this.email).subscribe({
      next: (response: any) => {
        this.isLoading$ = of(false);
        this.messageType = 'success';
        this.message = 'Verification email resent successfully.';
      },
      error: (error: any) => {
        this.isLoading$ = of(false);
        this.messageType = 'error';
        this.message = 'Failed to resend verification email.';
      }
    });
    this.unsubscribe.push(resendSub);
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
