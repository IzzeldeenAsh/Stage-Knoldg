import { Component, Injector } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { debounceTime, distinctUntilChanged, of, switchMap, takeUntil } from 'rxjs';
import { BaseComponent } from 'src/app/modules/base.component';
import { TransferCorporateAccountService } from 'src/app/_fake/services/transfer-coporate-account/transfer-corporate-account.service';

interface User {
  name: string;
  email: string;
  profile_image?: string;
  first_name: string;
  last_name: string;
  bgClass?: string;
}

@Component({
  selector: 'app-transfer-dialog',
  templateUrl: './transfer-dialog.component.html',
  styleUrls: ['./transfer-dialog.component.scss']
})
export class TransferDialogComponent extends BaseComponent {
  step: number = 1;
  isLoading: boolean = false;
  fetchedUsers: User[] = [];
  selectedUser: User | null = null;
  searchControl: FormControl = new FormControl('');
  code: string = '';

  constructor(
    injector: Injector,
    private transferCoporateAccountService: TransferCorporateAccountService,
    public ref: DynamicDialogRef
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term: string) => {
        if (term.trim() === '') {
          return of([]);
        }
        this.isLoading = true;
        return this.transferCoporateAccountService.searchInsighters(term, this.lang ?? 'en');
      }),
      takeUntil(this.unsubscribe$)
    ).subscribe({
      next: (response: any) => {
        const users: User[] = Array.isArray(response) ? response : response.data || [];
        this.fetchedUsers = users.map(user => ({
          ...user,
          bgClass: this.getRandomClass()
        }));
        this.isLoading = false;
      },
      error: (err) => {
        this.handleServerErrors(err);
        this.isLoading = false;
      },
    });
  }

  inviteUser(user: User) {
    const email = user.email;
    this.selectedUser = user;
    
    const inviteSub = this.transferCoporateAccountService
      .sendTransferInvitation(email, this.lang ?? 'en')
      .subscribe({
        next: () => {
          const title = this.lang === 'ar' ? 'تم إرسال الدعوة بنجاح' : 'Invitation sent successfully';
          const message = this.lang === 'ar' ? `تم إرسال الدعوة إلى ${email} بنجاح` : `Invitation sent to ${email} successfully`;
          this.showSuccess(title, message);
          this.step = 2;
        },
        error: (err) => this.handleServerErrors(err),
      });
    this.unsubscribe.push(inviteSub);
  }

  transfer() {
    if (!this.selectedUser) return;
    const verifySub = this.transferCoporateAccountService
      .verifyTransferInvitation(
        this.selectedUser.email,
        this.code,
        this.lang ?? 'en'
      )
      .subscribe({
        next: () => {
          const message = this.lang === 'ar' ? 'تم التحقق بنجاح' : 'Verification successful';
          this.showSuccess('', message);
          this.ref.close(true);
          window.location.reload();
        },
        error: (err) => this.handleServerErrors(err),
      });
    this.unsubscribe.push(verifySub);
  }

  getInitials(name: string) {
    return name.split(' ').map(word => word[0]).join('');
  }

  private getRandomClass(): string {
    const classes = [
      'bg-light-success',
      'bg-light-info',
      'bg-light-primary',
      'bg-light-warning',
      'bg-light-danger',
      'bg-light-secondary',
      'bg-light-dark'
    ];
    const randomIndex = Math.floor(Math.random() * classes.length);
    return classes[randomIndex];
  }

  private handleServerErrors(error: any) {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          this.showError(
            this.lang === 'ar' ? 'حدث خطأ' : 'An error occurred',
            messages.join(', ')
          );
        }
      }
    } else {
      this.showError(
        this.lang === 'ar' ? 'حدث خطأ' : 'An error occurred',
        this.lang === 'ar' ? 'حدث خطأ' : 'An unexpected error occurred.'
      );
    }
  }
} 