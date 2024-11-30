import { Component, OnDestroy, signal } from '@angular/core';
import { Message } from 'primeng/api';
import { Subject, throwError, takeUntil } from 'rxjs';
import { ChangePasswordService } from 'src/app/_fake/services/change-password/change-password.service';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent implements OnDestroy{
  constructor(private _changepassword:ChangePasswordService){}
 
  protected unsub$ = new Subject<void>();

  _oldPassword = signal('');
  _newPassword = signal('');
  _confirmPassword = signal('');

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




  _messages = signal<Message[]>([]);
  // Getter and Setter for messages
  get messages(): Message[] {
    return this._messages();
  }

  set messages(value: Message[]) {
    this._messages.set(value);
  }

  isEditing=signal(false);

  handleServerErrors(error: any) {
    this._messages.set([]);
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messagesArray = serverErrors[key];
          this._messages.update((msgs) => [
            ...msgs,
            {
              severity: 'error',
              summary: '',
              detail: messagesArray.join(', '),
            },
          ]);
        }
      }
    } else {
      this._messages.update((msgs) => [
        ...msgs,
        {
          severity: 'error',
          summary: 'Error',
          detail: 'An unexpected error occurred.',
        },
      ]);
    }
    return throwError(error);
  }

  changePassword(){
    const payload = {
      old_password : this._oldPassword(),
      new_password : this._newPassword(),
      password_confirmation: this._confirmPassword()
    };
    this.isEditing.set(true);
    this._changepassword.changePassword(payload)
    .pipe(takeUntil(this.unsub$))
    .subscribe(
      {
        next:()=>{
          this._messages.set([
            {
              severity: 'success',
              summary: 'Success',
              detail: 'Password changed successfully.',
            }
          ]),
          this.isEditing.set(false);
          this.clearForm();
        },
        error:(error)=>{
          this.handleServerErrors(error);
          this.isEditing.set(false);
          this.clearForm();
        }
      }
    );
  }
  clearForm() {
    this._oldPassword.set('');
    this._newPassword.set('');
    this._confirmPassword.set('');
  }

  editPassword(){
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
