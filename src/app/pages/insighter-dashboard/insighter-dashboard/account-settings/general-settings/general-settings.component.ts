import { ChangeDetectorRef, Component, Injector, OnInit } from '@angular/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { IKnoldgProfile } from 'src/app/_fake/models/profile.interface';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { BaseComponent } from 'src/app/modules/base.component';
import { DeactivateDialogComponent } from '../deactivate-dialog/deactivate-dialog.component';
import { DeleteDialogComponent } from '../delete-dialog/delete-dialog.component';
import { TransferDialogComponent } from '../transfer-dialog/transfer-dialog.component';
import { UserRequest, UserRequestsService } from 'src/app/_fake/services/user-requests/user-requests.service';

@Component({
  selector: 'app-general-settings',
  templateUrl: './general-settings.component.html',
  styleUrls: ['./general-settings.component.scss'],
  providers: [DialogService]
})
export class GeneralSettingsComponent extends BaseComponent implements OnInit {
  profile: IKnoldgProfile;
  roles: string[];
  isActive: boolean = true;
  isPrimaryKey: boolean = false;
  ref: DynamicDialogRef | undefined;
  hasPendingDeactivationRequest: boolean = false;

  constructor(
    injector: Injector,
    private getProfileService: ProfileService,
    private dialogService: DialogService,
    private userRequestsService: UserRequestsService,
    private cdr: ChangeDetectorRef
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.getProfile();
    this.checkPendingRequests();
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
          this.cdr.detectChanges();
        }
      )
    this.unsubscribe.push(subscription);
  }

  checkPendingRequests() {
    // Only proceed if user has insighter role
    if (!this.hasRole(['insighter'])) {
      console.log('User is not an insighter, skipping deactivation request check');
      return;
    }

    const subscription = this.userRequestsService.getAllUserRequests(this.lang)
      .subscribe({
        next: (requests: UserRequest[]) => {
          console.log('All user requests:', requests);
          
          if (!requests || requests.length === 0) {
            console.log('No requests returned from API');
            this.hasPendingDeactivationRequest = false;
            this.cdr.detectChanges();
            return;
          }
          
          // For insighter accounts, check ALL requests to find any pending deactivation
          this.hasPendingDeactivationRequest = requests.some(request => {
            // Extract the needed values with safe checks
            const typeKey = (request.type?.key || '').toLowerCase();
            const typeName = (request.type?.label || '').toLowerCase();
            const status = (request.status || '').toLowerCase();
            const requestableType = (request.requestable_type || '').toLowerCase();
            
            console.log('Request data:', {
              typeKey,
              typeName,
              status,
              requestableType
            });
            
            // Check if this is a deactivation/deletion request
            const deactivationKeywords = ['deactivat', 'delet', 'remov', 'cancel'];
            const isDeactivationRequest = deactivationKeywords.some(keyword => 
              typeKey.includes(keyword) || typeName.includes(keyword)
            );
            
            // Check if this request is related to insighter
            const insighterKeywords = ['insighter', 'expert', 'consultant'];
            const isInsighterRequest = insighterKeywords.some(keyword => 
              typeKey.includes(keyword) || 
              requestableType.includes(keyword) ||
              typeName.includes(keyword)
            );
            
            // Only check for 'pending' status specifically
            const isPendingStatus = status === 'pending';
            
            const result = isDeactivationRequest && isInsighterRequest && isPendingStatus;
                         
            if (result) {
              console.log('Found pending deactivation request:', request);
            }
            
            return result;
          });
          
          console.log('Final check result - Has pending deactivation request:', this.hasPendingDeactivationRequest);
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error fetching user requests:', error);
          this.cdr.detectChanges();
        }
      });
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

  showDeactivateDialog(deactivationType?: 'user' | 'company' | 'both') {
    this.ref = this.dialogService.open(DeactivateDialogComponent, {
      width: '650px',
      contentStyle: { overflow: 'auto' },
      baseZIndex: 10000,
      maximizable: false,
      closable: true,
      data: { deactivationType, insighter_status: this.profile.insighter_status, company_status: this.profile.company?.status }
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
