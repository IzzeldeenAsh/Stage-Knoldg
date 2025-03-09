import { Component, Injector, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ICreateKnowldege } from '../../create-account.helper';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-step5',
  templateUrl: './step5.component.html',
  styles: [`
    .p-calendar-custom {
      width: 100% !important;
    }
    .p-calendar-custom .p-inputtext {
      width: 100% !important;
      border: none !important;
      box-shadow: none !important;
    }
    .p-calendar-container .input-group {
      flex-wrap: nowrap;
    }
    :host ::ng-deep .p-datepicker {
      min-width: 350px;
    }
    :host ::ng-deep .p-datepicker-timeonly {
      padding: 1rem;
    }
  `]
})
export class Step5Component extends BaseComponent implements OnInit {
  @Input('updateParentModel') updateParentModel: (
    part: Partial<ICreateKnowldege>,
    isFormValid: boolean
  ) => void;

  @Input() defaultValues: Partial<ICreateKnowldege>;

  publishForm: FormGroup;
  minDate: Date = new Date();
  publishOptions = [
    {
      id: 'publish',
      value: 'now',
      label: 'PUBLISH_NOW',
      description: 'PUBLISH_NOW_DESC',
      icon: 'send'
    },
    {
      id: 'schedule',
      value: 'scheduled',
      label: 'SCHEDULE',
      description: 'SCHEDULE_DESC',
      icon: 'time'
    },
    {
      id: 'draft',
      value: 'draft',
      label: 'SAVE_AS_DRAFT',
      description: 'SAVE_AS_DRAFT_DESC',
      icon: 'document'
    }
  ];
  timeError: string = '';
  
  // Calendar configuration for PrimeNG
  timeFormat: string = '24';
  dateFormat: string = 'yy-mm-dd';

  constructor(injector: Injector, private fb: FormBuilder) {
    super(injector);
  }

  ngOnInit(): void {
    this.publishForm = this.fb.group({
      publishOption: [this.defaultValues.publish_status || '', Validators.required],
      publishDateTime: [null]
    });

    // Set validation rules for scheduled publishing
    this.publishForm.get('publishOption')?.valueChanges.subscribe(option => {
      const publishDateTimeControl = this.publishForm.get('publishDateTime');

      if (option === 'scheduled') {
        publishDateTimeControl?.setValidators([Validators.required]);
      } else {
        publishDateTimeControl?.clearValidators();
      }

      publishDateTimeControl?.updateValueAndValidity();

      // Update parent model with the selected option
      this.updateParentValues();
    });

    // React to form value changes
    this.publishForm.valueChanges.subscribe(() => {
      this.validateDateTime();
      this.updateParentValues();
    });

    // Initialize validation
    const option = this.publishForm.get('publishOption')?.value;
    if (option === 'scheduled') {
      this.publishForm.get('publishDateTime')?.setValidators([Validators.required]);
    }

    // Set defaults if we're in edit mode
    if (this.defaultValues.publish_status === 'scheduled' && this.defaultValues.publish_date_time) {
      this.publishForm.patchValue({
        publishOption: 'scheduled',
        publishDateTime: new Date(this.defaultValues.publish_date_time)
      });
    }
  }

  private getFormattedDateTime(): string | undefined {
    try {
      const dateTime = this.publishForm.get('publishDateTime')?.value;
      
      if (!dateTime || !(dateTime instanceof Date)) {
        return undefined;
      }
      
      // Format as MySQL datetime (YYYY-MM-DD HH:MM:SS)
      const year = dateTime.getFullYear();
      const month = dateTime.getMonth() + 1;
      const day = dateTime.getDate();
      const hours = dateTime.getHours();
      const minutes = dateTime.getMinutes();
      
      return `${year}-${this.padZero(month)}-${this.padZero(day)} ${this.padZero(hours)}:${this.padZero(minutes)}:00`;
    } catch (error) {
      console.error('Error formatting date/time:', error);
      return undefined;
    }
  }

  private padZero(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }

  private updateParentValues() {
    const publishOption = this.publishForm.get('publishOption')?.value;
    const publishDateTime = this.getFormattedDateTime();

    this.updateParentModel({
      publish_status: publishOption,
      publish_date_time: publishDateTime
    }, this.checkForm());
  }

  confirmSchedule() {
    // Final validation before confirming scheduled publish
    if (this.publishForm.valid && this.timeError === '') {
      const publishOption = this.publishForm.get('publishOption')?.value;
      const publishDateTime = this.getFormattedDateTime();

      this.updateParentModel({
        publish_status: publishOption,
        publish_date_time: publishDateTime
      }, true);
    }
  }

  saveAsDraft() {
    // Save as draft without validation
    this.updateParentModel({
      publish_status: 'draft',
      publish_date_time: undefined
    }, true);
  }

  checkForm(): boolean {
    const publishOption = this.publishForm.get('publishOption')?.value;
    
    // Basic form validation
    if (!publishOption) {
      return false;
    }

    // Additional validation for scheduled option
    if (publishOption === 'scheduled') {
      return this.publishForm.valid && this.timeError === '';
    }

    return true;
  }

  onDateTimeChange() {
    // When date/time changes, trigger datetime validation
    this.validateDateTime();
  }

  private validateDateTime() {
    // Clear previous errors
    this.timeError = '';
    
    const publishOption = this.publishForm.get('publishOption')?.value;
    
    if (publishOption !== 'scheduled') {
      return;
    }

    const dateTime = this.publishForm.get('publishDateTime')?.value;
    
    if (!dateTime || !(dateTime instanceof Date)) {
      return;
    }

    try {
      const now = new Date();
      
      // Check if the selected date is in the past
      if (dateTime <= now) {
        this.timeError = 'Selected date and time must be in the future';
      }
    } catch (error) {
      console.error('Error validating date/time:', error);
      this.timeError = 'Invalid date or time format';
    }
  }
} 