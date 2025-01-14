import { Component, Input } from '@angular/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ReactivateDialogComponent } from './reactivate-dialog/reactivate-dialog.component';

@Component({
  selector: 'app-activate-account',
  templateUrl: './activate-account.component.html',
  styleUrl: './activate-account.component.scss',
  providers: [DialogService]
})
export class ActivateAccountComponent {
  ref: DynamicDialogRef | undefined;
  @Input() role: string = 'company';
  constructor(private dialogService: DialogService) {}

  showReactivateDialog() {
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

  ngOnDestroy() {
    if (this.ref) {
      this.ref.close();
    }
  }
}
