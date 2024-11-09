import { Component, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators
} from "@angular/forms";
import { Observable, Subscription, of } from "rxjs";
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

  onSubmit(): void {
    if (this.registrationForm.invalid) {
      this.registrationForm.markAllAsTouched();
      return;
    }

    this.isLoadingSubmit$ = of(true);
    const formData = this.registrationForm.value;
    this.step = 2;
    // this.authService.register(formData).subscribe({
    //   next: (response) => {
    //     this.isLoadingSubmit$ = of(false);
    //     this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Registration successful! Verification email sent.' });
    //     this.step = 2; // Move to Email Verification step
    //   },
    //   error: (error) => {
    //     this.isLoadingSubmit$ = of(false);
    //     const errorMsg = error?.error?.message || 'An error occurred. Please try again.';
    //     this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
    //   }
    // });
  }

  resendVerificationEmail(): void {
    const email = this.registrationForm.value.email;
    if (!email) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Email is not available.' });
      return;
    }

    this.messageService.add({ severity: 'info', summary: 'Info', detail: 'Resending verification email...' });
    
    // this.authService.resendVerificationEmail(email).subscribe({
    //   next: (response) => {
    //     this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Verification email resent successfully.' });
    //   },
    //   error: (error) => {
    //     const errorMsg = error?.error?.message || 'Failed to resend verification email.';
    //     this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
    //   }
    // });
  }

  
}