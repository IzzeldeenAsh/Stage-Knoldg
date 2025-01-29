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
    if (this.config.data?.published_at) {
      const date = new Date(this.config.data.published_at);
      this.publishForm.patchValue({
        publishDate: date,
        publishTime: date
      });
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
    
    if (selectedDate < today) {
      this.publishForm.get('publishDate')?.setErrors({ 'pastDate': true });
    }
  }

  onSubmit(): void {
    if (this.publishForm.valid) {
      const date = this.publishForm.get('publishDate')?.value;
      const time = this.publishForm.get('publishTime')?.value;
      
      const publishDate = new Date(date);
      // Since time is a Date object from PrimeNG calendar
      publishDate.setHours(time.getHours(), time.getMinutes());

      const now = new Date();
      if (publishDate <= now) {
        this.timeError = 'Selected time must be in the future';
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
