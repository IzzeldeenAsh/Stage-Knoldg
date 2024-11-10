import { Component, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators
} from "@angular/forms";
import { BehaviorSubject, Observable, Subscription, of, timer } from "rxjs";
import { CountryService } from "src/app/_fake/services/countries-api/countries-get.service";
import { Country } from "src/app/_fake/services/countries/countries.service";
import { ScrollAnimsService } from "src/app/_fake/services/scroll-anims/scroll-anims.service";
import { AuthService } from "../../services/auth.service";
import { MessageService, Message } from 'primeng/api';
import { Router } from "@angular/router";
import { BaseComponent } from "src/app/modules/base.component";
import { TranslateService } from "@ngx-translate/core";
@Component({
  selector: "app-sign-up",
  templateUrl: "./sign-up.component.html",
  styleUrls: ["./sign-up.component.scss"],
})
export class SignUpComponent extends BaseComponent implements OnInit {
  step: number = 1; // 1: Registration Form, 2: Email Verification
  isLoadingCountries$: Observable<boolean> = of(true);
  isLoadingSubmit$: Observable<boolean> = of(false);
  registrationForm: FormGroup;
  countries: Country[] = [];
  showPassword: boolean = false;
  isResendDisabled = false;
  resendCountdown$ = new BehaviorSubject<number | null>(null);
  
  constructor(
    private fb: FormBuilder,
    private _countriesGet: CountryService,
    scrollAnims: ScrollAnimsService,
    private messageService: MessageService,
    private authService: AuthService,
    public translate :TranslateService,
    private router: Router
  ) {
    super(scrollAnims);
    this.registrationForm = this.fb.group({
      firstName: ["", [Validators.maxLength(50)]],
      lastName: ["", [Validators.maxLength(50)]],
      email: ["", [Validators.required, Validators.email]],
      password: [
        "",
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(
            /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
          ),
        ],
      ],
      country: [null], // Optional
    });
    this.isLoadingCountries$ = this._countriesGet.isLoading$;
  }

  ngOnInit(): void {
    this.getListOfCountries();
  }

  getListOfCountries() {
    const getCountriesSub = this._countriesGet.getCountries().subscribe({
      next: (res) => {
        this.countries = res.map((country: Country) => ({
          ...country,
          flagPath: `../../../../../assets/media/flags/${country.flag}.svg`,
          showFlag: true, // Default to showing the flag
        }));
        this.isLoadingCountries$ = of(false);
      },
      error: (err) => {
        console.log("Error fetching countries:", err);
        this.isLoadingCountries$ = of(false);
      },
    });
    this.unsubscribe.push(getCountriesSub);
  }

  onFlagError(country: any): void {
    country.showFlag = false; // Hide the image if it fails to load
  }


  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  signInWithGoogle(event: Event): void {
    event.preventDefault();
    this.authService.getGoogleAuthRedirectUrl().subscribe({
      next: (redirectUrl) => {
        window.location.href = redirectUrl;
      },
      error: (err) => {
        console.error('Error getting Google auth redirect URL', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to initiate Google sign-in.' });
      }
    });
  }
  
  signInWithLinkedIn(event: Event): void {
    event.preventDefault();
    this.authService.getLinkedInAuthRedirectUrl().subscribe({
      next: (redirectUrl) => {
        window.location.href = redirectUrl;
      },
      error: (err) => {
        console.error('Error getting LinkedIn auth redirect URL', err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to initiate LinkedIn sign-in.' });
      }
    });
  }
  private handleServerErrors(error: any): void {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      
      // Map server error keys to form control names
      const errorKeyToFormControlName: { [key: string]: string } = {
        'first_name': 'firstName',
        'last_name': 'lastName',
        'email': 'email',
        'password_confirmation': 'password'
        // Add other mappings as necessary
      };
  
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages: string[] = serverErrors[key];
          const formControlName = errorKeyToFormControlName[key];
  
          if (formControlName) {
            const control = this.registrationForm.get(formControlName);
            if (control) {
              // Set the server error on the control
              control.setErrors({ serverError: messages[0] }); // Use the first error message
              control.markAsTouched(); // Mark as touched to display the error
            }
          } else {
            // If the error doesn't map to a form control, display it as a general message
            const generalErrorMsg = error.error.message || messages.join(', ');
            this.messageService.add({ severity: 'error', summary: 'Error', detail: generalErrorMsg });
          }
        }
      }
    } else {
      // Handle non-validation errors
      const generalErrorMsg = error.error?.message || 'An unexpected error occurred.';
      this.messageService.add({ severity: 'error', summary: 'Error', detail: generalErrorMsg });
    }
  }
  onSubmit(): void {
    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    this.isLoadingSubmit$ = of(true);
    const formData = this.registrationForm.value;
    const user = {
      first_name: formData.firstName,
      last_name: formData.lastName ,
      email: formData.email,
      password: formData.password,
      password_confirmation: formData.password,
      country_id: formData.country.id 
    };
 
    this.authService.registration(user).subscribe({
      next: (response) => {
        this.isLoadingSubmit$ = of(false);
        console.log("sign-up resopone",response);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Registration successful! Verification email sent.' });
        this.step = 2; // Move to Email Verification step
        this.startResendCooldown()
      },
      error: (error) => {
        this.isLoadingSubmit$ = of(false);
        this.handleServerErrors(error);
      }
    });
  }
 
  
  resendVerificationEmail(): void {
   

    this.authService.resendVerificationEmail().subscribe({
      next: (response:any) => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Verification email resent successfully.' });
       
      },
      error: (error:any) => {
        const errorMsg = error?.error?.message || 'Failed to resend verification email.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
      }
    });
  }
onResendClick(): void {
    if (this.isResendDisabled) return;

    this.resendVerificationEmail();
    this.startResendCooldown();
  }
  startResendCooldown(): void {
    this.isResendDisabled = true;
    const countdownTime = 30; // seconds

    // Emit countdown values every second
    timer(0, 1000).subscribe({
      next: (elapsedTime) => {
        const remainingTime = countdownTime - elapsedTime;
        if (remainingTime >= 0) {
          this.resendCountdown$.next(remainingTime);
        } else {
          this.resendCountdown$.next(null);
          this.isResendDisabled = false;
        }
      },
      complete: () => this.isResendDisabled = false
    });
  }
  
}