import { Component, Injector, OnInit } from '@angular/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { IKnoldgProfile } from 'src/app/_fake/models/profile.interface';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { BaseComponent } from 'src/app/modules/base.component';
import { DeactivateDialogComponent } from '../deactivate-dialog/deactivate-dialog.component';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import { TransferDialogComponent } from '../transfer-dialog/transfer-dialog.component';

@Component({
  selector: 'app-general-settings',
  templateUrl: './general-settings.component.html',
  styleUrl: './general-settings.component.scss',
  providers: [DialogService]
})
export class GeneralSettingsComponent extends BaseComponent implements OnInit {
  profile: IKnoldgProfile;
  roles: string[];
  isActive: boolean = true;
  isPrimaryKey: boolean = false;
  ref: DynamicDialogRef | undefined;

  constructor(
    injector: Injector,
    private getProfileService: ProfileService,
    private dialogService: DialogService
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.getProfile();
  }

  getProfile() {
    const subscription = this.getProfileService.getProfile()
      .subscribe(
        (profile: IKnoldgProfile) => {
          this.profile = profile;
          this.roles = profile.roles;
          switch (true) {
            case this.hasRole(['insighter']):
              this.isActive = profile.insighter_status === "active";
              this.isPrimaryKey = true;
              break;
            case this.hasRole(['company']):
              this.isActive = profile.company?.status === "active";
              this.isPrimaryKey = !!profile.company?.primary_activate_at;
              break;
            default:
              this.isActive = false;
          }
        }
      )
    this.unsubscribe.push(subscription);
  }

  showTransferDialog() {
    this.ref = this.dialogService.open(TransferDialogComponent, {
      header: this.lang === 'ar' ? 'نقل الحساب' : 'Transfer Account',
      width: '650px',
      contentStyle: { overflow: 'auto' },
      baseZIndex: 10000,
      maximizable: false,
      closable: true
    });

    this.ref.onClose.subscribe((success: boolean) => {
      if (success) {
        window.location.reload();
      }
    });
  }

  showDeactivateDialog() {
    this.ref = this.dialogService.open(DeactivateDialogComponent, {
      width: '650px',
      contentStyle: { overflow: 'auto' },
      baseZIndex: 10000,
      maximizable: false,
      closable: true
    });

    this.ref.onClose.subscribe((success: boolean) => {
      if (success) {
        window.location.reload();
      }
    });
  }

  showDeleteDialog() {
    this.ref = this.dialogService.open(DeleteDialogComponent, {
      width: '650px',
      contentStyle: { overflow: 'auto' },
      baseZIndex: 10000,
      maximizable: false,
      closable: true
    });

    this.ref.onClose.subscribe((success: boolean) => {
      if (success) {
        window.location.reload();
      }
    });
  }

  hasRole(requiredRoles: string[]): boolean {
    return requiredRoles.some((role) => this.roles.includes(role));
  }

  ngOnDestroy() {
    if (this.ref) {
      this.ref.close();
    }
  }
}
