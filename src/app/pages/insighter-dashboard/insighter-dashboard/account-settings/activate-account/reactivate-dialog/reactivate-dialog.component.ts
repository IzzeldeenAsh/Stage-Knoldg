import { Component, Injector } from '@angular/core';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import { BaseComponent } from 'src/app/modules/base.component';
import { UserRequestsService } from 'src/app/_fake/services/user-requests/user-requests.service';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';

@Component({
  selector: 'app-reactivate-dialog',
  templateUrl: './reactivate-dialog.component.html',
  styleUrls: ['./reactivate-dialog.component.scss']
})
export class ReactivateDialogComponent extends BaseComponent {
  step: number = 1;
  successStep: boolean = false;
  errorStep: boolean = false;
  isLoading: boolean = false;
  roles: any[] = [];
  constructor(
    injector: Injector,
    private userRequestsService: UserRequestsService,
    public ref: DynamicDialogRef,
    private profileService: ProfileService
    
  ) {
    super(injector);
  }

  ngOnInit() {
const sub=this.profileService.getProfile().subscribe((res: any) => {
  this.roles = res.roles;
});
  }

  reactivateAccount() {
    this.isLoading = true;
    const reactivateRequest = this.userRequestsService.sendReactivateRequest(this.roles.includes('company') ? 'company' : 'insighter');
    reactivateRequest.subscribe({
      next: () => {
        this.showSuccess('', this.lang === "ar" ? "تم إعادة تفعيل حسابك بنجاح" : "Your account has been successfully reactivated");
        this.successStep = true;
        this.isLoading = false;
        setTimeout(() => {
          this.ref.close(true);
          window.location.reload();
        }, 1500);
      },
      error: () => {
        this.errorStep = true;
        this.isLoading = false;
        const message = this.lang === "ar" ? "حدث خطأ أثناء إعادة تفعيل حسابك" : "An error occurred while reactivating your account";
        this.showError('', message);
        setTimeout(() => {
          this.ref.close(false);
        }, 1500);
      }
    });
  }
} 