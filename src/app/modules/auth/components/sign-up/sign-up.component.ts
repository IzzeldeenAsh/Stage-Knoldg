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
@Component({
  selector: "app-sign-up",
  templateUrl: "./sign-up.component.html",
  styleUrls: ["./sign-up.component.scss"],
})
export class SignUpComponent implements OnInit {
  isLoadingCountries$: Observable<boolean> = of(true);
  isLoadingSubmit$: Observable<boolean> = of(false);
  registrationForm: FormGroup;
  countries: Country[] = [];
  showPassword: boolean = false;
  private unsubscribe: Subscription[] = [];
  selectedCountry: Country | null = null;

  constructor(
    private fb: FormBuilder,
    private _countriesGet: CountryService,
    private scrollAnims: ScrollAnimsService,
    private messageService: MessageService,
    private authService: AuthService
  ) {
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
      },
      error: (err) => {
        console.log("err", err);
      },
    });
    this.unsubscribe.push(getCountriesSub);
  }

  onFlagError(country: any): void {
    country.showFlag = false; // Hide the image if it fails to load
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.scrollAnims.scrollAnimations();
    }, 100); // Delay to ensure DOM elements are fully loaded
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
    if (this.registrationForm.valid) {
      this.isLoadingSubmit$ = of(true);
      // Simulate form submission delay
      setTimeout(() => {
        console.log("Form Submitted:", this.registrationForm.value);
        this.isLoadingSubmit$ = of(false);
        // Optionally, reset the form or navigate to another page
        // this.registrationForm.reset();
      }, 1500);
    } else {
      // Mark all controls as touched to trigger validation messages
      this.registrationForm.markAllAsTouched();
    }
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
