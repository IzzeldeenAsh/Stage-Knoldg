import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
  minTime: Date = new Date();

  constructor(
    private fb: FormBuilder,
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig
  ) {
    this.publishForm = this.fb.group({
      publishDate: ['', Validators.required],
      publishTime: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Set minTime to be 1 hour after current time
    this.updateMinTime();

    if (this.config.data?.published_at) {
      const date = new Date(this.config.data.published_at);
      this.publishForm.patchValue({
        publishDate: date,
        publishTime: date
      });
    }
    
    // Add value change listeners for real-time validation
    this.publishForm.get('publishTime')?.valueChanges.subscribe(() => {
      this.validateCurrentTimeSelection();
    });
  }
  
  /**
   * Updates the minimum allowed time to be 1 hour after current time
   */
  private updateMinTime(): void {
    const now = new Date();
    this.minTime = new Date();
    this.minTime.setHours(now.getHours() + 1);
    this.minTime.setMinutes(now.getMinutes());
    
    // Update time error message if there's a time already selected
    this.validateCurrentTimeSelection();
  }
  
  /**
   * Validates the current time selection and sets appropriate error message
   */
  private validateCurrentTimeSelection(): void {
    const selectedTime = this.publishForm.get('publishTime')?.value;
    const selectedDate = this.publishForm.get('publishDate')?.value;
    
    if (selectedTime && selectedDate) {
      const now = new Date();
      const oneHourFromNow = new Date(now);
      oneHourFromNow.setHours(now.getHours() + 1);
      
      const publishDateTime = new Date(selectedDate);
      publishDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      
      if (publishDateTime < oneHourFromNow) {
        this.timeError = 'Selected time must be at least one hour from now';
      } else {
        this.timeError = '';
      }
    }
  }

  private formatTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  onDateSelect(): void {
    const selectedDate = this.publishForm.get('publishDate')?.value;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of today
    
    // Clear previous time errors
    this.timeError = '';
    
    // Update time validation based on selected date
    if (this.isSameDay(selectedDate, new Date())) {
      // If today is selected, enforce the minimum time constraint
      this.updateMinTime();
    } else {
      // If future date is selected, any time is valid
      this.minTime = new Date(selectedDate);
      this.minTime.setHours(0, 0, 0, 0);
    }
    
    // Update time field if it's now invalid with the new date selection
    const selectedTime = this.publishForm.get('publishTime')?.value;
    if (selectedTime && this.isSameDay(selectedDate, new Date())) {
      const now = new Date();
      if ((selectedTime.getHours() < now.getHours() + 1) || 
          (selectedTime.getHours() === now.getHours() + 1 && selectedTime.getMinutes() < now.getMinutes())) {
        // Instead of resetting to null, set the minimum valid time 
        // This is more user-friendly as it shows a valid time instead of an empty field
        this.publishForm.get('publishTime')?.setValue(this.minTime);
        this.timeError = 'Time has been adjusted to the minimum allowed (1 hour from now)';
      }
    }
  }
  
  /**
   * Checks if two dates are on the same calendar day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  onSubmit(): void {
    if (this.publishForm.valid) {
      const date = this.publishForm.get('publishDate')?.value;
      const time = this.publishForm.get('publishTime')?.value;
      
      const publishDate = new Date(date);
      // Since time is a Date object from PrimeNG calendar
      publishDate.setHours(time.getHours(), time.getMinutes());

      const now = new Date();
      const oneHourFromNow = new Date(now);
      oneHourFromNow.setHours(now.getHours() + 1);
      
      if (publishDate < oneHourFromNow) {
        this.timeError = 'Selected time must be at least one hour from now';
        return;
      }

      this.ref.close({
        publishDate: publishDate.toISOString()
      });
    }
  }

  onCancel(): void {
    this.ref.close();
  }
}
