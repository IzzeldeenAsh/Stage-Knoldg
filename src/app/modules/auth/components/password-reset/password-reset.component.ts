import { Component, Injector, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Router } from '@angular/router';
import { BaseComponent } from 'src/app/modules/base.component';
import { PasswordResetService } from 'src/app/_fake/services/password-reset/password-reset.service';
import { TranslationService } from 'src/app/modules/i18n';

@Component({
  selector: 'app-password-reset',
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.scss'],
})
export class PasswordResetComponent extends BaseComponent implements OnInit {
  step: number = 1; // 1: Email submission, 2: Reset form
  emailForm: FormGroup;
  resetForm: FormGroup;
  messages: any[] = [];
  successRest:boolean=false;
  lang:string= 'en'
  constructor(

    private fb: FormBuilder,
    public passwordResetService: PasswordResetService,
    private router: Router,
    private translation:TranslationService,
    injector: Injector
  ) {
    super(injector);
    this.lang = this.translation.getSelectedLanguage()
  }

  ngOnInit(): void {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.resetForm = this.fb.group({
      code: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(6),  Validators.required,
        Validators.minLength(8),
        Validators.pattern(
          /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        ),]],
      password_confirmation: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  // Custom validator to check if password and confirm password match
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const confirm = form.get('password_confirmation')?.value;
    return password === confirm ? null : { mismatch: true };
  }

  // Submit email form
  submitEmail() {
    this.messageService.clear()
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }
    const email = this.emailForm.value.email;

    this.passwordResetService.forgetPassword(email).subscribe({
      next: (response) => {
        const message= this.lang ==='ar' ?'تم ارسال كود التفعيل للايميل' :  'Verification code sent to your email.' ;
        this.showSuccess('',message)
  
        this.step = 2; // Move to the reset form
      },
      error: (error) => {
        const errorMsg = error?.error?.message || 'An error occurred. Please try again.';
        this.showError('',errorMsg)
      }
    });

  }

  // Submit reset form
  submitReset() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const { code, password, password_confirmation } = this.resetForm.value;

    this.passwordResetService.resetPassword(code, password, password_confirmation).subscribe({
      next: (response) => {
        this.step = 3; // Move to the reset form
      },
      error: (error) => {
        const errorMsg = error?.error?.message || 'An error occurred. Please try again.';
        this.showError('',errorMsg)
      }
    });
  }
}
