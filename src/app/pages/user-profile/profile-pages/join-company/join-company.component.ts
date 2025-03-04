import { Component, Injector, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { InvitationService } from 'src/app/_fake/services/invitation/invitation.service';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-join-company',
  templateUrl: './join-company.component.html',
  styleUrls: ['./join-company.component.scss']
})
export class JoinCompanyComponent extends BaseComponent implements OnInit {
  invitationForm!: FormGroup;
  isLoading$: Observable<boolean> = of(false);
  isProcessingInvitation$: Observable<boolean>;

  constructor(
    injector: Injector,
    private readonly fb: FormBuilder,
    private _invitationService: InvitationService
  ) {
    super(injector);
    this.isProcessingInvitation$ = this._invitationService.isLoading$;
  }

  ngOnInit(): void {
    this.initInvitationForm();
  }

  initInvitationForm() {
    this.invitationForm = this.fb.group({
      invitationCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern('^[0-9]*$')]]
    });
  }

  onSubmitInvitation() {
    if (this.invitationForm.invalid) {
      return;
    }

    const code = this.invitationForm.get('invitationCode')?.value;

    this._invitationService.acceptInsighterInvitation(code).subscribe({
      next: (response) => {
        const message = this.lang === "ar" 
          ? "تم قبول الدعوة بنجاح"
          : "Invitation accepted successfully";
        this.showSuccess("", message);
        this.invitationForm.reset();
        // Reload to reflect changes
        document.location.reload();
      },
      error: (error) => {
        this.handleServerErrors(error);
      }
    });
  }

  private handleServerErrors(error: any) {
    let errorMessage = '';
    
    if (error.error && typeof error.error === 'object') {
      // Handle structured error responses
      if (error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error.error) {
        errorMessage = error.error.error;
      } else {
        // Try to extract first error message from validation errors
        const firstErrorKey = Object.keys(error.error)[0];
        if (firstErrorKey && Array.isArray(error.error[firstErrorKey])) {
          errorMessage = error.error[firstErrorKey][0];
        }
      }
    } else {
      // Fallback for unstructured errors
      errorMessage = error.message || 'An unexpected error occurred';
    }
    
    this.showError('', errorMessage);
  }
}
