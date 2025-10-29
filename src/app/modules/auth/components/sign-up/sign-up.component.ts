import { Component, Injector, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { BehaviorSubject, Observable, Subscription, of, take, timer } from "rxjs";
import { CountriesService, Country } from "src/app/_fake/services/countries/countries.service";
import { AuthService } from "../../services/auth.service";
import { BaseComponent } from "src/app/modules/base.component";
import zxcvbn from 'zxcvbn';
import { trigger, transition, style, animate } from "@angular/animations";
import { CommonService } from "src/app/_fake/services/common/common.service";
import { environment } from "src/environments/environment";

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

  private socialAuthPending: 'google' | 'linkedin' | null = null;

  constructor(
    private fb: FormBuilder,
    private countriesService: CountriesService,
    private authService: AuthService,
    private commonService: CommonService,
    injector: Injector
  ) {
    super(injector);
    this.initializeForm();
    this.isLoadingCountries$ = this.countriesService.isLoading$;
  }

  ngOnInit(): void {
    this.loadCountries();
    this.setupPasswordStrengthValidation();
    this.loadClientAgreement();
  }

  private initializeForm(): void {
    this.registrationForm = this.fb.group({
      firstName: ["", [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      lastName: ["", [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ["", [Validators.required, Validators.email]],
      password: [
        "",
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\W_]{8,}$/),
        ],
      ],
      country: [null, [Validators.required]],
      client_agreement: [false, [Validators.requiredTrue]]
    });
  }

  private setupPasswordStrengthValidation(): void {
    this.registrationForm.get('password')?.valueChanges.subscribe(password => {
      this.evaluatePasswordStrength(password);
    });
  }

  private loadCountries(): void {
    this.countriesService.getCountries().subscribe({
      next: (countries) => {
        this.countries = countries.map((country: Country) => ({
          ...country,
          flagPath: `../../../../../assets/media/flags/${country.flag}.svg`,
          showFlag: true,
        }));
        this.isLoadingCountries$ = of(false);
      },
      error: (error) => {
        console.error('Error loading countries:', error);
        this.isLoadingCountries$ = of(false);
      }
    });
  }

  private loadClientAgreement(): void {
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

  getHomeUrl(): string {
    return `${environment.mainAppUrl}/${this.lang}`;
  }

  // Client agreement dialog methods
  openAgreementDialog(): void {
    this.showAgreementDialog = true;
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
    
    this.socialAuthPending = null;
  }

  printTerms(): void {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
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
      
      const blob = new Blob([termsText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${termsTitle.replace(/\s+/g, '-')}.txt`;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  }

  private stripHtmlTags(html: string): string {
    const tempElement = document.createElement('div');
    tempElement.innerHTML = html;
    return tempElement.textContent || tempElement.innerText || '';
  }

  // Password strength evaluation
  evaluatePasswordStrength(password: string): void {
    if (password) {
      const evaluation = zxcvbn(password);
      
      // Check if password meets validation requirements
      const passwordControl = this.registrationForm.get('password');
      const isPasswordValid = passwordControl && !passwordControl.hasError('pattern') && !passwordControl.hasError('minlength');
      
      // If password doesn't meet validation requirements, force score to be low (0 or 1)
      if (!isPasswordValid) {
        this.passwordStrength.score = password.length < 8 ? 0 : 1;
        this.passwordStrength.feedback = evaluation.feedback.warning || 
          evaluation.feedback.suggestions.join(' ') || 
          'Password must be at least 8 characters with letters, numbers, and special characters.';
      } else {
        this.passwordStrength.score = evaluation.score;
        this.passwordStrength.feedback = evaluation.feedback.warning || evaluation.feedback.suggestions.join(' ');
      }
    } else {
      this.passwordStrength.score = 0;
      this.passwordStrength.feedback = '';
    }
  }

  passwordStrengthClass(): string {
    const classes = ['bg-danger', 'bg-warning', 'bg-info', 'bg-success', 'bg-success'];
    return classes[this.passwordStrength.score] || 'bg-danger';
  }

  getPasswordStrengthLabel(): string {
    const labels = {
      en: ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'],
      ar: ['ضعيف جداً', 'ضعيف', 'معتدل', 'جيد', 'قوي']
    };
    
    const langLabels = labels[this.lang as 'en' | 'ar'] || labels.en;
    return langLabels[this.passwordStrength.score] || '';
  }

  // UI methods
  onFlagError(country: any): void {
    country.showFlag = false;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Social authentication methods
  signInWithGoogle(event: Event): void {
    event.preventDefault();
    this.socialAuthPending = 'google';
    this.showAgreementDialog = true;
  }
  
  signInWithLinkedIn(event: Event): void {
    event.preventDefault();
    this.socialAuthPending = 'linkedin';
    this.showAgreementDialog = true;
  }

  private proceedWithGoogleAuth(): void {
    this.authService.getGoogleAuthRedirectUrl().subscribe({
      next: (redirectUrl) => {
        window.location.href = redirectUrl;
      },
      error: (err) => {
        console.error('Error getting Google auth redirect URL', err);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to initiate Google sign-in.' 
        });
      }
    });
  }
  
  private proceedWithLinkedInAuth(): void {
    this.authService.getLinkedInAuthRedirectUrl().subscribe({
      next: (redirectUrl) => {
        window.location.href = redirectUrl;
      },
      error: (err) => {
        console.error('Error getting LinkedIn auth redirect URL', err);
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to initiate LinkedIn sign-in.' 
        });
      }
    });
  }

  // Registration form submission
  onSubmit(): void {
    // Mark all fields as touched to trigger validation display
    this.registrationForm.markAllAsTouched();
    
    if (this.registrationForm.invalid) {
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
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Success', 
          detail: 'Registration successful! Verification email sent.' 
        });
        this.step = 2;
        this.startResendCooldown();
      },
      error: (error) => {
        this.isLoadingSubmit$ = of(false);
        this.handleServerErrors(error);
      }
    });
  }

  private handleServerErrors(error: any): void {
    if (error.validationMessages) {
      // Display validation messages using the message service
      error.validationMessages.forEach((msg: any) => {
        this.messageService.add({
          severity: msg.severity,
          summary: msg.summary,
          detail: msg.detail
        });
      });
    }

    // Also set form control errors for specific fields
    if (error.error?.errors) {
      const serverErrors = error.error.errors;
      const errorKeyMapping: { [key: string]: string } = {
        'first_name': 'firstName',
        'last_name': 'lastName',
        'email': 'email',
        'password': 'password',
        'password_confirmation': 'password',
        'client_agreement': 'client_agreement'
      };
  
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages: string[] = serverErrors[key];
          const formControlName = errorKeyMapping[key];
  
          if (formControlName) {
            const control = this.registrationForm.get(formControlName);
            if (control) {
              control.setErrors({ serverError: messages[0] });
              control.markAsTouched();
            }
          }
        }
      }
    }
  }

  // Email verification methods
  resendVerificationEmail(): void {
    this.isResendDisabled = true;
    
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
        this.isResendDisabled = false;
        
        if (error.validationMessages) {
          error.validationMessages.forEach((msg: any) => {
            this.messageService.add({
              severity: msg.severity,
              summary: msg.summary,
              detail: msg.detail
            });
          });
        } else {
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: 'Failed to resend verification email.' 
          });
        }
      }
    });
  }

  onResendClick(): void {
    this.resendVerificationEmail();
  }

  private startResendCooldown(): void {
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

    this.unsubscribe.push(resendTimerSubscription);
  }
}