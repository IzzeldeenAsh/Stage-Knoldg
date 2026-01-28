import { Component, EventEmitter, Injector, OnDestroy, Output, computed, signal } from '@angular/core';
import { Subject, Subscription, interval, takeUntil } from 'rxjs';
import { BaseComponent } from 'src/app/modules/base.component';
import { SetPasswordService } from 'src/app/_fake/services/set-password/set-password.service';

@Component({
  selector: 'app-set-password',
  templateUrl: './set-password.component.html',
  styleUrls: ['./set-password.component.scss'],
})
export class SetPasswordComponent extends BaseComponent implements OnDestroy {
  @Output() passwordSet = new EventEmitter<void>();

  constructor(
    injector: Injector,
    private setPasswordService: SetPasswordService
  ) {
    super(injector);
  }

  protected unsub$ = new Subject<void>();

  // Form fields
  _password = signal('');
  _confirmPassword = signal('');
  _code = signal('');

  // UI state
  isEditing = signal(false);
  isSendingCode = signal(false);
  isSubmitting = signal(false);
  codeSent = signal(false);
  resendCooldown = signal(0); // seconds

  // Password visibility toggles
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  private cooldownSub?: Subscription;

  isRtl(): boolean {
    return this.lang === 'ar';
  }

  get password(): string {
    return this._password();
  }
  set password(value: string) {
    this._password.set(value);
  }

  get confirmPassword(): string {
    return this._confirmPassword();
  }
  set confirmPassword(value: string) {
    this._confirmPassword.set(value);
  }

  get code(): string {
    return this._code();
  }
  set code(value: string) {
    this._code.set(value);
  }

  passwordsMatch = computed(() => this._password() === this._confirmPassword());

  togglePasswordVisibility() {
    this.showPassword.update((v) => !v);
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword.update((v) => !v);
  }

  private handleServerErrors(error: any) {
    if (error?.error?.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (Object.prototype.hasOwnProperty.call(serverErrors, key)) {
          const messages = serverErrors[key];
          if (Array.isArray(messages)) {
            this.showError(this.lang === 'ar' ? 'حدث خطأ' : 'An error occurred', messages.join(', '));
          } else {
            this.showError(this.lang === 'ar' ? 'حدث خطأ' : 'An error occurred', String(messages));
          }
        }
      }
    } else {
      const msg = error?.error?.message || (this.lang === 'ar' ? 'حدث خطأ غير متوقع.' : 'An unexpected error occurred.');
      this.showError(this.lang === 'ar' ? 'حدث خطأ' : 'An error occurred', String(msg));
    }
  }

  private startCooldown(seconds: number) {
    this.cooldownSub?.unsubscribe();
    this.resendCooldown.set(seconds);
    this.cooldownSub = interval(1000)
      .pipe(takeUntil(this.unsub$))
      .subscribe(() => {
        const next = this.resendCooldown() - 1;
        this.resendCooldown.set(Math.max(0, next));
        if (next <= 0) {
          this.cooldownSub?.unsubscribe();
        }
      });
  }

  beginSetPassword() {
    if (this.isSendingCode()) return;
    this.isEditing.set(true);
    this.sendCode();
  }

  sendCode() {
    if (this.isSendingCode() || this.resendCooldown() > 0) return;
    this.isSendingCode.set(true);
    this.setPasswordService
      .sendSetPasswordCode()
      .pipe(takeUntil(this.unsub$))
      .subscribe({
        next: () => {
          this.codeSent.set(true);
          this.startCooldown(60);
          this.showSuccess('', this.lang === 'ar' ? 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' : 'Verification code sent to your email');
          this.isSendingCode.set(false);
        },
        error: (error) => {
          this.handleServerErrors(error);
          this.isSendingCode.set(false);
        },
      });
  }

  submitSetPassword() {
    if (this.isSubmitting()) return;

    if (!this.passwordsMatch()) {
      this.showError(
        this.lang === 'ar' ? 'خطأ في التحقق' : 'Validation Error',
        this.lang === 'ar' ? 'كلمة المرور وتأكيد كلمة المرور غير متطابقين' : 'Password and Confirm Password do not match.'
      );
      return;
    }

    const codeNum = Number(this._code());
    if (!Number.isFinite(codeNum) || codeNum <= 0) {
      this.showError(
        this.lang === 'ar' ? 'خطأ في التحقق' : 'Validation Error',
        this.lang === 'ar' ? 'يرجى إدخال رمز صحيح' : 'Please enter a valid code.'
      );
      return;
    }

    const payload = {
      password: this._password(),
      password_confirmation: this._confirmPassword(),
      code: codeNum,
    };

    this.isSubmitting.set(true);
    this.setPasswordService
      .setPassword(payload)
      .pipe(takeUntil(this.unsub$))
      .subscribe({
        next: () => {
          this.showSuccess('', this.lang === 'ar' ? 'تم تعيين كلمة المرور بنجاح' : 'Password set successfully');
          this.isSubmitting.set(false);
          this.passwordSet.emit();
          this.cancelEdit();
        },
        error: (error) => {
          this.handleServerErrors(error);
          this.isSubmitting.set(false);
        },
      });
  }

  cancelEdit() {
    this.isEditing.set(false);
    this._password.set('');
    this._confirmPassword.set('');
    this._code.set('');
    this.showPassword.set(false);
    this.showConfirmPassword.set(false);
  }

  ngOnDestroy(): void {
    this.cooldownSub?.unsubscribe();
    this.unsub$.next();
    this.unsub$.complete();
  }
}

