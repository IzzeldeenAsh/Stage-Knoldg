import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';

@Component({
  selector: 'app-schedule-publish-dialog',
  templateUrl: './schedule-publish-dialog.component.html',
  styles: [`
    ::ng-deep .p-calendar {
      width: 100%;
    }
    ::ng-deep .p-calendar .p-inputtext {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
      height: calc(1.5em + 1.5rem + 2px);
    }
    ::ng-deep .p-calendar .p-button {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      border-top-right-radius: 0.475rem;
      border-bottom-right-radius: 0.475rem;
      width: 3rem;
      height: calc(1.5em + 1.5rem + 2px);
      background: #FAFAFA;
      border: 1px solid #DFDFDF;
      color: #6E6E6E;
    }
    ::ng-deep .p-calendar .p-button:enabled:hover {
      background: #FAFAFA;
      border-color: #DFDFDF;
      color: #6E6E6E;
    }
    ::ng-deep .p-calendar .p-button:enabled:active {
      background: var(--kt-input-group-addon-bg);
      border-color: var(--kt-input-border-color);
      color: var(--kt-input-group-addon-color);
    }
    ::ng-deep .p-calendar .p-button:focus {
      box-shadow: none;
      border-color: var(--kt-input-focus-border-color);
    }
    ::ng-deep .p-calendar .p-button:enabled:focus {
      box-shadow: none;
    }
  `]
})
export class SchedulePublishDialogComponent implements OnInit {
  publishForm: FormGroup;
  minDate = new Date();
  timeError: string = '';

  constructor(
    private fb: FormBuilder,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {
    this.initializeForm();
  }

  // Custom validator for date - must be today or future
  private dateValidator = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null;
    }

    const selectedDate = new Date(control.value);
    const today = new Date();
    
    // Reset hours to compare dates properly
    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return { pastDate: true };
    }
    
    return null;
  };

  // Custom validator for datetime combination - must be at least 1 hour from now
  private dateTimeValidator = (control: AbstractControl): ValidationErrors | null => {
    const dateValue = this.publishForm?.get('publishDate')?.value;
    const timeValue = control.value;
    
    if (!dateValue || !timeValue) {
      return null;
    }
    
    try {
      // Create a combined date-time object
      const scheduledDate = new Date(dateValue);
      scheduledDate.setHours(timeValue.getHours(), timeValue.getMinutes(), 0, 0);
      
      const now = new Date();
      
      // Check if the scheduled date is in the past
      if (scheduledDate <= now) {
        return { pastDateTime: true };
      }
      
      // Check if the scheduled time is at least 1 hour from now
      const oneHourFromNow = new Date(now.getTime() + (60 * 60 * 1000));
      
      if (scheduledDate < oneHourFromNow) {
        return { tooSoon: true };
      }
      
      return null;
    } catch (error) {
      console.error('Error validating date/time:', error);
      return { invalidDateTime: true };
    }
  };

  private initializeForm(): void {
    this.publishForm = this.fb.group({
      publishDate: ['', [Validators.required, this.dateValidator]],
      publishTime: ['', [Validators.required, this.dateTimeValidator]]
    });

    // React to form value changes
    this.publishForm.valueChanges.subscribe(() => {
      this.updateTimeError();
    });

    // Add specific subscription for time changes to trigger immediate validation
    this.publishForm.get('publishTime')?.valueChanges.subscribe(() => {
      // Re-validate time field when time changes
      this.publishForm.get('publishTime')?.updateValueAndValidity();
    });
  }

  private updateTimeError(): void {
    const publishDateControl = this.publishForm.get('publishDate');
    const publishTimeControl = this.publishForm.get('publishTime');
    
    // Check for date errors
    if (publishDateControl?.errors?.['pastDate']) {
      this.timeError = 'Selected date cannot be in the past';
      return;
    }
    
    // Check for time errors
    if (publishTimeControl?.errors?.['pastDateTime']) {
      this.timeError = 'Selected time cannot be in the past';
      return;
    }
    
    if (publishTimeControl?.errors?.['tooSoon']) {
      this.timeError = 'Selected time must be at least one hour from now';
      return;
    }
    
    if (publishTimeControl?.errors?.['invalidDateTime']) {
      this.timeError = 'Invalid date or time';
      return;
    }
    
    // Clear error if no validation errors
    this.timeError = '';
  }

  ngOnInit(): void {
    if (this.config.data?.published_at) {
      const date = new Date(this.config.data.published_at);
      this.publishForm.patchValue({
        publishDate: date,
        publishTime: date
      });
    }
  }

  onDateSelect(): void {
    // Trigger validation when date is selected
    const publishDateControl = this.publishForm.get('publishDate');
    const publishTimeControl = this.publishForm.get('publishTime');
    
    // Re-validate both date and time when date changes
    publishDateControl?.updateValueAndValidity();
    
    // Important: Re-validate time when date changes since time validator depends on date
    if (publishTimeControl?.value) {
      publishTimeControl?.updateValueAndValidity();
    }
    
    this.updateTimeError();
  }
  
  /**
   * Checks if two dates are on the same calendar day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  /**
   * Validates the form and marks all fields as touched to show validation errors
   */
  private validateForm(): boolean {
    // Mark all controls as touched to show validation errors
    Object.keys(this.publishForm.controls).forEach(key => {
      this.publishForm.get(key)?.markAsTouched();
    });
    
    // Update time error display
    this.updateTimeError();
    
    // Return form validity
    return this.publishForm.valid;
  }

  onSubmit(): void {
    // Use the comprehensive validation before submission
    if (!this.validateForm()) {
      return; // Don't submit if validation fails
    }

    const date = this.publishForm.get('publishDate')?.value;
    const time = this.publishForm.get('publishTime')?.value;
    
    const publishDate = new Date(date);
    // Since time is a Date object from PrimeNG calendar
    publishDate.setHours(time.getHours(), time.getMinutes(), 0);

    // Format as YYYY-MM-DD HH:MM:SS
    const formattedDateTime = this.formatDateTime(publishDate);

    this.ref.close({
      publishDate: formattedDateTime
    });
  }

  private formatDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    
    return `${year}-${this.padZero(month)}-${this.padZero(day)} ${this.padZero(hours)}:${this.padZero(minutes)}:${this.padZero(seconds)}`;
  }

  private padZero(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }

  onCancel(): void {
    this.ref.close();
  }
}
