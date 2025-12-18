import { Component, Injector, Input } from '@angular/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ReactivateDialogComponent } from './reactivate-dialog/reactivate-dialog.component';
import { BaseComponent } from 'src/app/modules/base.component';
import { AgreementService } from 'src/app/_fake/services/agreement/agreement.service';

@Component({
  selector: 'app-activate-account',
  templateUrl: './activate-account.component.html',
  styleUrl: './activate-account.component.scss',
  providers: [DialogService]
})
export class ActivateAccountComponent extends BaseComponent {
  ref: DynamicDialogRef | undefined;
  @Input() role: string = 'company';
  showAgreementModal = false;

  constructor(
    private dialogService: DialogService,
    private agreementService: AgreementService,
    injector: Injector
  ) {
    super(injector);
  }

  showReactivateDialog() {
    // Check if user has accepted the latest agreement before proceeding
    this.agreementService.checkLatestAgreement().subscribe({
      next: (accepted) => {
        if (accepted) {
          this.openReactivateDialog();
        } else {
          this.openAgreementModal();
        }
      },
      error: () => {
        // On API error, require explicit agreement to proceed
        this.openAgreementModal();
      }
    });
  }

  private openReactivateDialog() {
    this.ref = this.dialogService.open(ReactivateDialogComponent, {
      header: 'Reactivate Account',
      width: '450px',
      contentStyle: { overflow: 'auto' },
      baseZIndex: 10000,
      maximizable: false,
      closable: true,
      
    });

    this.ref.onClose.subscribe((success: boolean) => {
      if (success) {
        window.location.reload();
      }
    });
  }

  // Agreement modal flow
  openAgreementModal() {
    this.showAgreementModal = true;
  }

  onAgreementAccepted() {
    this.showAgreementModal = false;
    // After accepting agreements, proceed to reactivate
    this.openReactivateDialog();
  }

  onAgreementCancelled() {
    this.showAgreementModal = false;
  }

  ngOnDestroy() {
    if (this.ref) {
      this.ref.close();
    }
  }
}
