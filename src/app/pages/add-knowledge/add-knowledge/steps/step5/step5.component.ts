import { Component, Injector, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ICreateKnowldege } from '../../create-account.helper';
import { BaseComponent } from 'src/app/modules/base.component';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';

@Component({
  selector: 'app-step5',
  templateUrl: './step5.component.html',
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
  publishOptions: Array<{
    id: string;
    value: string;
    label: string;
    description: string;
    icon: string;
  }> = [];
  isCompanyInsighter: boolean = false;
  timeError: string = '';
  
  // Calendar configuration for PrimeNG
  timeFormat: string = '24';
  dateFormat: string = 'yy-mm-dd';

  constructor(injector: Injector, private fb: FormBuilder, private profileService: ProfileService) {
    super(injector);
  }

  ngOnInit(): void {
    // First, check if user is a company-insighter
    this.profileService.getProfile().subscribe(profile => {
      this.isCompanyInsighter = profile.roles?.includes('company-insighter') || false;
      this.initializePublishOptions();
      this.initializeForm();
    });
  }

  private initializePublishOptions() {
    if (this.isCompanyInsighter) {
      this.publishOptions = [
        {
          id: 'review',
          value: 'in_review',
          label: 'SEND_TO_CEO_REVIEW',
          description: 'SEND_TO_CEO_REVIEW_DESC',
          icon: 'send'
        },
        {
          id: 'draft',
          value: 'unpublished',
          label: 'SAVE_AS_DRAFT',
          description: 'SAVE_AS_DRAFT_DESC',
          icon: 'document'
        }
      ];
    } else {
      this.publishOptions = [
        {
          id: 'publish',
          value: 'published',
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
          value: 'unpublished',
          label: 'SAVE_AS_DRAFT',
          description: 'SAVE_AS_DRAFT_DESC',
          icon: 'document'
        }
      ];
    }
  }
  
  private initializeForm() {
    this.publishForm = this.fb.group({
      publishOption: [this.defaultValues.publish_status || '', Validators.required],
      publishDate: [null],
      publishTime: [null]
    });

    // Set validation rules for scheduled publishing
    this.publishForm.get('publishOption')?.valueChanges.subscribe(option => {
      const publishDateControl = this.publishForm.get('publishDate');
      const publishTimeControl = this.publishForm.get('publishTime');

      if (option === 'scheduled') {
        publishDateControl?.setValidators([Validators.required]);
        publishTimeControl?.setValidators([Validators.required]);
      } else {
        publishDateControl?.clearValidators();
        publishTimeControl?.clearValidators();
      }

      publishDateControl?.updateValueAndValidity();
      publishTimeControl?.updateValueAndValidity();

      // Update parent model with the selected option
      this.updateParentValues();
    });

    // React to form value changes
    this.publishForm.valueChanges.subscribe(() => {
      this.validateDateTime();
      this.updateParentValues();
    });

    // Set defaults if we're in edit mode
    if (this.defaultValues.publish_status === 'scheduled' && this.defaultValues.publish_date_time) {
      const date = new Date(this.defaultValues.publish_date_time);
      this.publishForm.patchValue({
        publishOption: 'scheduled',
        publishDate: date,
        publishTime: date
      });
    }
  }

  onDateSelect(): void {
    const selectedDate = this.publishForm.get('publishDate')?.value;
    const today = new Date();
    
    if (selectedDate && selectedDate < today && selectedDate.toDateString() !== today.toDateString()) {
      this.publishForm.get('publishDate')?.setErrors({ 'pastDate': true });
    }
    
    this.validateDateTime();
  }

  private getFormattedDateTime(): string | undefined {
    try {
      const dateValue = this.publishForm.get('publishDate')?.value;
      const timeValue = this.publishForm.get('publishTime')?.value;
      
      if (!dateValue || !timeValue || !(dateValue instanceof Date) || !(timeValue instanceof Date)) {
        return undefined;
      }
      
      // Create a new date combining the date and time values
      const combinedDate = new Date(dateValue);
      combinedDate.setHours(timeValue.getHours(), timeValue.getMinutes(), 0);
      
      // Format as MySQL datetime (YYYY-MM-DD HH:MM:SS)
      const year = combinedDate.getFullYear();
      const month = combinedDate.getMonth() + 1;
      const day = combinedDate.getDate();
      const hours = combinedDate.getHours();
      const minutes = combinedDate.getMinutes();
      
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

  private validateDateTime() {
    // Clear previous errors
    this.timeError = '';
    
    const publishOption = this.publishForm.get('publishOption')?.value;
    
    if (publishOption !== 'scheduled') {
      return;
    }

    const dateValue = this.publishForm.get('publishDate')?.value;
    const timeValue = this.publishForm.get('publishTime')?.value;
    
    if (!dateValue || !timeValue) {
      return;
    }
    
    try {
      // Create a combined date-time object
      const scheduledDate = new Date(dateValue);
      scheduledDate.setHours(timeValue.getHours(), timeValue.getMinutes(), 0);
      
      const now = new Date();
      
      if (scheduledDate <= now) {
        this.timeError = 'Selected time must be in the future';
        return;
      }
      
    } catch (error) {
      console.error('Error validating date/time:', error);
      this.timeError = 'Invalid date or time';
    }
  }
}