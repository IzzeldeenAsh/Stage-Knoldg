import { Component, OnDestroy, signal, computed, Injector } from '@angular/core';
import { Message, MessageService } from 'primeng/api';
import { Subject, takeUntil, throwError } from 'rxjs';
import { ChangePasswordService } from 'src/app/_fake/services/change-password/change-password.service';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent extends BaseComponent implements OnDestroy {
  constructor(private _changepassword: ChangePasswordService,
    injector: Injector
  ) {
    super(injector);}

  protected unsub$ = new Subject<void>();

  _oldPassword = signal('');
  _newPassword = signal('');
  _confirmPassword = signal('');
  
  // Password visibility toggles
  showOldPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);
  
  // RTL direction check
  isRtl(): boolean {
    return this.lang === 'ar';
  }
  
  // Toggle password visibility functions
  toggleOldPasswordVisibility() {
    this.showOldPassword.update(value => !value);
  }
  
  toggleNewPasswordVisibility() {
    this.showNewPassword.update(value => !value);
  }
  
  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.update(value => !value);
  }

  // Getter and Setter for oldPassword
  get oldPassword(): string {
    return this._oldPassword();
  }

  set oldPassword(value: string) {
    this._oldPassword.set(value);
  }

  // Getter and Setter for newPassword
  get newPassword(): string {
    return this._newPassword();
  }

  set newPassword(value: string) {
    this._newPassword.set(value);
  }

  // Getter and Setter for confirmPassword
  get confirmPassword(): string {
    return this._confirmPassword();
  }

  set confirmPassword(value: string) {
    this._confirmPassword.set(value);
  }

  // Computed signal to check if passwords match
  passwordsMatch = computed(() => this._newPassword() === this._confirmPassword());

  _messages = signal<Message[]>([]);
  // Getter and Setter for messages
  get messages(): Message[] {
    return this._messages();
  }

  set messages(value: Message[]) {
    this._messages.set(value);
  }

  isEditing = signal(false);

  private handleServerErrors(error: any) {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          if (error.error.type === "warning") {
            this.showWarn('Error',messages.join(", "));
          } else {
            this.showError('Error',messages.join(", "));
          }
        }
      }
    } else {
      this.showError('','An unexpected error occurred.');
    }
  }

  changePassword() {
    // Prevent submission if passwords do not match
    if (!this.passwordsMatch()) {
      this._messages.set([
        {
          severity: 'error',
          summary: 'Validation Error',
          detail: 'New Password and Confirm Password do not match.',
        },
      ]);
      return;
    }

    const payload = {
      old_password: this._oldPassword(),
      new_password: this._newPassword(),
      password_confirmation: this._confirmPassword(),
    };
    this.isEditing.set(true);
    this._changepassword
      .changePassword(payload)
      .pipe(takeUntil(this.unsub$))
      .subscribe({
        next: () => {
         this.showSuccess('','Changes Successfully')
          this.isEditing.set(false);
          this.clearForm();
        },
        error: (error) => {
          this.handleServerErrors(error);
          this.isEditing.set(true);
        },
      });
  }

  clearForm() {
    this._oldPassword.set('');
    this._newPassword.set('');
    this._confirmPassword.set('');
    this.showOldPassword.set(false);
    this.showNewPassword.set(false);
    this.showConfirmPassword.set(false);
  }

  editPassword() {
    this.isEditing.set(true);
  }

  cancelEdit() {
    this.isEditing.set(false);
    this.clearForm();
  }

  ngOnDestroy(): void {
    this.unsub$.next();
    this.unsub$.complete();
  }
} 