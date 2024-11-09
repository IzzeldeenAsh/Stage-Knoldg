import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { MessageService } from 'primeng/api'; // Assuming you're using PrimeNG for p-messages
import { Router } from '@angular/router';
import { ScrollAnimsService } from 'src/app/_fake/services/scroll-anims/scroll-anims.service';
import { BaseComponent } from 'src/app/modules/base.component';
import { PasswordResetService } from 'src/app/_fake/services/password-reset/password-reset.service';

@Component({
  selector: 'app-password-reset',
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.scss'],
  providers: [MessageService] // Provide MessageService here
})
export class PasswordResetComponent extends BaseComponent implements OnInit {
  step: number = 1; // 1: Email submission, 2: Reset form
  emailForm: FormGroup;
  resetForm: FormGroup;
  messages: any[] = [];

  constructor(
    scrollAnims: ScrollAnimsService,
    private fb: FormBuilder,
    public passwordResetService: PasswordResetService,
    private messageService: MessageService,
    private router: Router
  ) {
    super(scrollAnims);
  }

  ngOnInit(): void {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.resetForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6,7}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
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
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }
    const email = this.emailForm.value.email;

    this.passwordResetService.forgetPassword(email).subscribe({
      next: (response) => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Verification code sent to your email.' });
        this.step = 2; // Move to the reset form
      },
      error: (error) => {
        const errorMsg = error?.error?.message || 'An error occurred. Please try again.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
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
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Password has been reset successfully.' });
        // Optionally, redirect to login after a delay
        setTimeout(() => {
          this.router.navigate(['/authentication/layouts/creative/sign-in.html']);
        }, 2000);
      },
      error: (error) => {
        const errorMsg = error?.error?.message || 'An error occurred. Please try again.';
        this.messageService.add({ severity: 'error', summary: 'Error', detail: errorMsg });
      }
    });
  }
}
