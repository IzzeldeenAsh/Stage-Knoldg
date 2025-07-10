import { Component, Injector, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  Validators
} from "@angular/forms";
import { BehaviorSubject, Observable, Subscription, of, take, timer } from "rxjs";
import { CountriesService, Country } from "src/app/_fake/services/countries/countries.service";
import { AuthService } from "../../services/auth.service";
import { BaseComponent } from "src/app/modules/base.component";
import zxcvbn from 'zxcvbn';
import { trigger, transition, style, animate } from "@angular/animations";
import { CommonService } from "src/app/_fake/services/common/common.service";
import { HttpClient, HttpHeaders } from "@angular/common/http";

@Component({
  selector: "app-sign-up",
  templateUrl: "./sign-up.component.html",
  styleUrls: ["./sign-up.component.scss"],
   animations: [
    trigger('fadeInMoveY', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ])
  ]
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
  passwordStrength: any = {
    score: 0,
    feedback: ''
  };

  // Client agreement related properties
  showAgreementDialog: boolean = false;
  clientAgreementContent: any = null;
  isLoadingAgreement: boolean = false;
  userScrolledToBottom: boolean = false;
  agreementDialogScrollable: boolean = true;

  // Add a new property to track which social auth method was selected
  private socialAuthPending: 'google' | 'linkedin' | null = null;

  constructor(
    private fb: FormBuilder,
    private _countriesGet: CountriesService,
    private authService: AuthService,
    private http: HttpClient,
    private adminCountreis: CountriesService,
    private commonService: CommonService,
    injector: Injector
  ) {
    super(injector);
    this.registrationForm = this.fb.group({
      firstName: ["", [Validators.maxLength(50)]],
      lastName: ["", [Validators.maxLength(50)]],
      email: ["", [Validators.required, Validators.email]],
      password: [
        "",
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\W_]{8,}$/),
        ],
      ],
      country: [null], // Optional
      client_agreement: [false, [Validators.requiredTrue]] // Required and must be true
    });
    this.isLoadingCountries$ = this._countriesGet.isLoading$;
  }

  ngOnInit(): void {
    this.adminCountreis.getCountries().subscribe()
    this.getListOfCountries();
    this.registrationForm.get('password')?.valueChanges.subscribe(password => {
      this.evaluatePasswordStrength(password);
    });
    // Fetch client agreement on initialization
    this.loadClientAgreement();
  }

  loadClientAgreement(): void {
    this.isLoadingAgreement = true;
    this.commonService.getClientAgreement('client-agreement').subscribe({
      next: (response) => {
        this.clientAgreementContent = response.data;
        this.isLoadingAgreement = false;
      },
      error: (error) => {
        console.error('Error loading client agreement:', error);
        this.isLoadingAgreement = false;
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to load client agreement' 
        });
      }
    });
  }

  openAgreementDialog(): void {
    // Always show the dialog when triggered
    this.showAgreementDialog = true;
  }

  getHomeUrl(): string {
    const url= 'https://knoldg.com/' + this.lang;
    return url;
  }

  closeAgreementDialog(approved: boolean): void {
    this.showAgreementDialog = false;
    
    if (approved) {
      this.registrationForm.get('client_agreement')?.setValue(true);
      
      // If this was triggered by a social auth button, proceed with that auth method
      if (this.socialAuthPending === 'google') {
        this.proceedWithGoogleAuth();
      } else if (this.socialAuthPending === 'linkedin') {
        this.proceedWithLinkedInAuth();
      }
    } else {
      this.registrationForm.get('client_agreement')?.setValue(false);
    }
    
    // Reset the pending social auth
    this.socialAuthPending = null;
  }

  printTerms(): void {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      // Prepare content for printing
      const termsTitle = this.clientAgreementContent?.name || 'Terms of Service';
      const termsContent = this.clientAgreementContent?.guideline || '';
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${termsTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
            h1 { color: #333; text-align: center; margin-bottom: 20px; }
            .content { margin: 0 auto; max-width: 800px; }
          </style>
        </head>
        <body>
          <h1>${termsTitle}</h1>
          <div class="content">${termsContent}</div>
        </body>
        </html>
      `;
      
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Could not open print window. Please check your browser settings.' 
      });
    }
  }

  saveTerms(): void {
    if (this.clientAgreementContent) {
      const termsTitle = this.clientAgreementContent.name || 'Terms-of-Service';
      const termsText = this.stripHtmlTags(this.clientAgreementContent.guideline);
      
      // Create a Blob with the text content
      const blob = new Blob([termsText], { type: 'text/plain' });
      
      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${termsTitle.replace(/\s+/g, '-')}.txt`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  }

  private stripHtmlTags(html: string): string {
    // Create a temporary element to extract text from HTML
    const tempElement = document.createElement('div');
    tempElement.innerHTML = html;
    return tempElement.textContent || tempElement.innerText || '';
  }

  evaluatePasswordStrength(password: string): void {
    if (password) {
      const evaluation = zxcvbn(password);
      this.passwordStrength.score = evaluation.score;
      this.passwordStrength.feedback = evaluation.feedback.warning || evaluation.feedback.suggestions.join(' ');
    } else {
      this.passwordStrength.score = 0;
      this.passwordStrength.feedback = '';
    }
  }

  passwordStrengthClass(): string {
    switch (this.passwordStrength.score) {
      case 0:
        return 'bg-danger';
      case 1:
        return 'bg-warning';
      case 2:
        return 'bg-info';
      case 3:
        return 'bg-success';
      case 4:
        return 'bg-success';
      default:
        return 'bg-danger';
    }
  }

  getPasswordStrengthLabel(): string {
    if(this.lang==='en'){
      switch (this.passwordStrength.score) {
        case 0:
          return 'Very Weak';
        case 1:
          return 'Weak';
        case 2:
          return 'Fair';
        case 3:
          return 'Good';
        case 4:
          return 'Strong';
        default:
          return '';
      }
    }else{
      switch (this.passwordStrength.score) {
        case 0:
          return 'ضعيف جداً ';
        case 1:
          return 'ضعيف';
        case 2:
          return 'معتدل';
        case 3:
          return 'جيد';
        case 4:
          return 'قوي';
        default:
          return '';
      }
    }
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
    // Show agreement dialog first
    this.socialAuthPending = 'google';
    this.showAgreementDialog = true;
  }
  
  signInWithLinkedIn(event: Event): void {
    event.preventDefault();
    // Show agreement dialog first
    this.socialAuthPending = 'linkedin';
    this.showAgreementDialog = true;
  }


  private proceedWithGoogleAuth(): void {
    this.authService.getGoogleAuthRedirectUrl().subscribe({
      next: (redirectUrl) => {
        const authtoken:any = localStorage.getItem('foresighta-creds');
        const token = JSON.parse(authtoken);
        if (token && token.authToken) {
          window.location.href = `https://knoldg.com/en/callback/${token.authToken}`;
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
  
  private proceedWithLinkedInAuth(): void {
    this.authService.getLinkedInAuthRedirectUrl().subscribe({
      next: (redirectUrl) => {
        const authtoken:any = localStorage.getItem('foresighta-creds');
        const token = JSON.parse(authtoken);
        if (token && token.authToken) {
          window.location.href = `https://knoldg.com/en/callback/${token.authToken}`;
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

  private handleServerErrors(error: any): void {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      
      // Map server error keys to form control names
      const errorKeyToFormControlName: { [key: string]: string } = {
        'first_name': 'firstName',
        'last_name': 'lastName',
        'email': 'email',
        'password_confirmation': 'password',
        'client_agreement': 'client_agreement'
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
      last_name: formData.lastName,
      email: formData.email,
      password: formData.password,
      password_confirmation: formData.password,
      country_id: formData.country?.id,
      client_agreement: formData.client_agreement
    };
 
    this.authService.registration(user).subscribe({
      next: (response) => {
        this.isLoadingSubmit$ = of(false);
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
    this.isResendDisabled = true; // Disable immediately
    this.authService.resendVerificationEmail().subscribe({
      next: (response: any) => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Success', 
          detail: 'Verification email resent successfully.' 
        });
        this.startResendCooldown();
      },
      error: (error: any) => {
        this.isResendDisabled = false; // Re-enable on error
        const errorMsg = error?.error?.message || 'Failed to resend verification email.';
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: errorMsg 
        });
      }
    });
  }

  onResendClick(): void {
    this.resendVerificationEmail();
  }

  startResendCooldown(): void {
    const countdownTime = 30; // seconds

    this.resendCountdown$.next(countdownTime);
    
    const resendTimerSubscription = timer(1, 1000).pipe(
      take(countdownTime)
    ).subscribe({
      next: (elapsedTime) => {
        const remainingTime = countdownTime - elapsedTime;
        this.resendCountdown$.next(remainingTime);
      },
      complete: () => {
        this.resendCountdown$.next(null);
        this.isResendDisabled = false;
      }
    });

    if (resendTimerSubscription) {
      this.unsubscribe.push(resendTimerSubscription)
    }
  }
}