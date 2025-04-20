import { Component, OnInit, OnDestroy, ChangeDetectorRef, Injector } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { Observable } from "rxjs";
import { first } from "rxjs/operators";
import { AuthService } from "../../services/auth.service";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { TranslationService } from "src/app/modules/i18n/translation.service";
import { ScrollAnimsService } from "src/app/_fake/services/scroll-anims/scroll-anims.service";
import { Message, MessageService } from "primeng/api";
import {BaseComponent} from "src/app/modules/base.component"
@Component({
  selector: "app-login",
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent extends BaseComponent implements OnInit, OnDestroy {
  // KeenThemes mock, change it to:
  defaultAuth: any = {
    email: null,
    password: null,
  };
  loginForm: FormGroup;
  hasError: boolean;
  returnUrl: string;
  isLoading$: Observable<boolean>;
  selectedLang: string = "en";
  messages: Message[] = []; // Array to hold error messages
  isRTL: boolean = false; // Added for RTL logic
  passwordVisible: boolean = false;
  // private fields

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private translationService: TranslationService,
    injector: Injector
  ) {
    super(injector);
    // Now you can use someOtherService alongside base services
    this.isLoading$ = this.authService.isLoading$;
    this.selectedLang = this.translationService.getSelectedLanguage();
    this.isRTL = this.selectedLang === "ar"; // Set RTL based on the selected language
  }
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.scrollAnims.scrollAnimations();
    }, 100); // Delay to ensure DOM elements are fully loaded
  }

  ngOnInit(): void {
    this.initForm();
    // get return url from route parameters or default to '/'
    this.returnUrl =
      this.route.snapshot.queryParams["returnUrl".toString()] || "/";

    this.translationService.onLanguageChange().subscribe((lang) => {
      this.selectedLang = lang;
    });
  }

  // convenience getter for easy access to form fields
  get f() {
    return this.loginForm.controls;
  }

  initForm() {
    this.loginForm = this.fb.group({
      email: [
        this.defaultAuth.email,
        Validators.compose([
          Validators.required,
          Validators.email,
          Validators.minLength(3),
          Validators.maxLength(320), // https://stackoverflow.com/questions/386294/what-is-the-maximum-length-of-a-valid-email-address
        ]),
      ],
      password: [
        this.defaultAuth.password,
        Validators.compose([
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ]),
      ],
    });
  }

  signInWithGoogle(event: Event): void {
    event.preventDefault();
    this.authService.getGoogleAuthRedirectUrl().subscribe({
      next: (redirectUrl) => {
        const authtoken:any = localStorage.getItem('foresighta-creds');
        const token = JSON.parse(authtoken);
        if (token && token.authToken) {
          window.location.href = `http://localhost:3000/en/callback/${token.authToken}`;
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

  signInWithLinkedIn(event: Event): void {
    event.preventDefault();
    this.authService.getLinkedInAuthRedirectUrl().subscribe({
      next: (redirectUrl) => {
        const authtoken:any = localStorage.getItem('foresighta-creds');
        const token = JSON.parse(authtoken);
        if (token && token.authToken) {
          window.location.href = `http://localhost:3000/en/callback/${token.authToken}`;
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

  togglePasswordVisibility(passwordField: HTMLInputElement): void {
    this.passwordVisible = !this.passwordVisible;
    passwordField.type = this.passwordVisible ? "text" : "password";
  }
  submit() {
    this.hasError = false;

    const loginSubscr = this.authService
      .login(this.f.email.value, this.f.password.value , this.selectedLang ? this.selectedLang :'en')
      .pipe(first())
      .subscribe({
        next: (res) => {
          if (res && res?.roles) {
            if (res.roles.includes("admin") || res.roles.includes("staff")) {
              this.router.navigate(["/admin-dashboard"]);
            } else {
              const authtoken:any = localStorage.getItem('foresighta-creds');
              const token = JSON.parse(authtoken);
              if (token.authToken) {
                window.location.href = `http://localhost:3000/en/callback/${token.authToken}`;
              }
            }
          }
        },
        error: (error) => {
          this.messages = [];

          // Check if the error contains validation messages
          if (error.validationMessages) {
            this.messages = error.validationMessages; // Set the messages array
          } else {
            this.messages.push({
              severity: "error",
              summary: "Error",
              detail: "An unexpected error occurred.",
            });
          }
        },
      });
    this.unsubscribe.push(loginSubscr);
  }


}
