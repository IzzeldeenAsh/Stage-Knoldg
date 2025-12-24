import { Component, Injector, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
    private router: Router,
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
        this.router.navigate(['/app/profile/overview']).then(() => {
          window.location.reload();
        });
      },
      error: (error) => {
        this.handleServerErrors(error);
      }
    });
  }

  private handleServerErrors(error: any) {
    let errorMessage = '';
    console.log('Error response:', error); // Add this for debugging
    
    if (error.error && typeof error.error === 'object') {
      // Handle structured error responses
      if (error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error.error) {
        errorMessage = error.error.error;
      } else if (error.error.errors) {
        // Handle errors object with common field
        if (error.error.errors.common && Array.isArray(error.error.errors.common)) {
          errorMessage = error.error.errors.common[0];
        } else {
          // Try to extract first error message from validation errors
          const firstErrorKey = Object.keys(error.error.errors)[0];
          if (firstErrorKey && Array.isArray(error.error.errors[firstErrorKey])) {
            errorMessage = error.error.errors[firstErrorKey][0];
          }
        }
      } else {
        // Try to extract first error message from validation errors
        const firstErrorKey = Object.keys(error.error)[0];
        if (firstErrorKey && Array.isArray(error.error[firstErrorKey])) {
          errorMessage = error.error[firstErrorKey][0];
        }
      }
    } else {
      // Fallback for unstructured errorsc
      errorMessage = error.message || 'An unexpected error occurred';
    }
    
    console.log('Extracted error message:', errorMessage); // Add this for debugging
    if (error.error.type === "warning") {
      this.showWarn('Warning',errorMessage);
    } else {
      this.showError('Error',errorMessage);
    }
  }
}
