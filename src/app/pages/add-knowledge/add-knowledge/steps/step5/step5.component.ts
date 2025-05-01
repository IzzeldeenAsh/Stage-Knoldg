import { Component, Injector, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ICreateKnowldege } from '../../create-account.helper';
import { BaseComponent } from 'src/app/modules/base.component';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-step5',
  templateUrl: './step5.component.html',
  styles: [`
    /* Calendar styles */
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
    
    /* Radio button selection styles */
    :host ::ng-deep .btn-check:checked + .btn-outline {
      background-color: #f1faff !important;
      color: #009ef7 !important;
      border: 1px solid #009ef7 !important;
      box-shadow: 0 0 10px rgba(0, 158, 247, 0.1);
    }
    
    :host ::ng-deep .btn-check:checked + .btn-outline .text-gray-800 {
      color: #009ef7 !important;
      font-weight: 600 !important;
    }
    
    :host ::ng-deep .btn-check:checked + .btn-outline .text-gray-600 {
      color: #0095e8 !important;
    }
    
    /* Hover effect for options */
    :host ::ng-deep .btn-outline:hover {
      background-color: #f8f8f8;
      transition: all 0.3s ease;
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
  userProfile: any = null;
  timeError: string = '';
  hasOnlyTwoOptions: boolean = false;
  
  // Calendar configuration for PrimeNG
  timeFormat: string = '24';
  dateFormat: string = 'yy-mm-dd';

  constructor(
    injector: Injector, 
    private fb: FormBuilder, 
    private profileService: ProfileService,
    private translateService: TranslateService
  ) {
    super(injector);
    
    // Add translation keys
    this.addTranslations();
  }

  private addTranslations() {
    // Add translation keys for account status messages
    const translations = {
      'en': {
        'ACCOUNT_STATUS_NOTICE': 'Account Status Notice',
        'ACTIVE_ACCOUNT_REQUIRED_MESSAGE': 'You need an active account to publish or schedule your knowledge. In the meantime, you can save it as a draft.',
        'SEND_TO_MANAGER': 'Send to Manager',
        'SEND_TO_MANAGER_DESC': 'Submit your knowledge for manager review before publishing.'
      },
      'ar': {
        'ACCOUNT_STATUS_NOTICE': 'إشعار حالة الحساب',
        'ACTIVE_ACCOUNT_REQUIRED_MESSAGE': 'تحتاج إلى حساب نشط لنشر أو جدولة المعرفة الخاصة بك. في غضون ذلك، يمكنك حفظها كمسودة.',
        'SEND_TO_MANAGER': 'إرسال إلى المدير',
        'SEND_TO_MANAGER_DESC': 'أرسل المعرفة الخاصة بك للمراجعة من قبل المدير قبل النشر.'
      }
    };
    
    // Add translations for each language
    for (const [lang, trans] of Object.entries(translations)) {
      this.translateService.setTranslation(lang, trans, true);
    }
  }

  ngOnInit(): void {
    // Get user profile data to determine roles and status
    this.profileService.getProfile().subscribe(profile => {
      this.userProfile = profile;
      console.log('User Profile:', this.userProfile);
      console.log('User Roles:', this.userProfile?.roles);
      this.initializePublishOptions();
      this.initializeForm();
    });
  }

  private initializePublishOptions() {
    // Check if roles array exists and contains specific roles
    const roles = this.userProfile?.roles || [];
    console.log('Roles array:', roles);
    
    const isCompany = Array.isArray(roles) && roles.includes('company');
    const isInsighter = Array.isArray(roles) && roles.includes('insighter');
    const isCompanyInsighter = Array.isArray(roles) && roles.includes('company-insighter');
    
    console.log('Role checks:', { isCompany, isInsighter, isCompanyInsighter });
    
    // Check if user status is active
    let isActive = false;
    
    if (isCompany && this.userProfile?.company?.status === 'active') {
      isActive = true;
    }
    
    if (isInsighter && this.userProfile?.insighter_status === 'active') {
      isActive = true;
    }
    
    console.log('Is active:', isActive);
    
    // Check for company-insighter role first
    if (isCompanyInsighter) {
      console.log('Setting company-insighter options');
      
      // Check if the company-insighter has active status
      const isCompanyInsighterActive = this.userProfile?.insighter_status === 'active';
      console.log('Company-Insighter active status:', isCompanyInsighterActive);
      
      if (isCompanyInsighterActive) {
        // For active company-insighter, show both options
        this.publishOptions = [
          {
            id: 'draft',
            value: 'unpublished',
            label: 'SAVE_AS_DRAFT',
            description: 'SAVE_AS_DRAFT_DESC',
            icon: 'document'
          },
          {
            id: 'review',
            value: 'in_review',
            label: 'SEND_TO_MANAGER',
            description: 'SEND_TO_MANAGER_DESC',
            icon: 'eye'
          }
        ];
        
        this.hasOnlyTwoOptions = false;
      } else {
        // For inactive company-insighter, show only draft option
        this.publishOptions = [
          {
            id: 'draft',
            value: 'unpublished',
            label: 'SAVE_AS_DRAFT',
            description: 'SAVE_AS_DRAFT_DESC',
            icon: 'document'
          }
        ];
        
        // Set to true to show the alert for inactive accounts
        this.hasOnlyTwoOptions = true;
      }
      
      console.log('Final publish options for company-insighter:', this.publishOptions);
      return;
    }
    
    // Always have "Save as Draft" option
    this.publishOptions = [
      {
        id: 'draft',
        value: 'unpublished',
        label: 'SAVE_AS_DRAFT',
        description: 'SAVE_AS_DRAFT_DESC',
        icon: 'document'
      }
    ];
    
    // Only add other options if user is active
    if (isActive) {
      // Add Schedule option
      this.publishOptions.unshift({
        id: 'schedule',
        value: 'scheduled',
        label: 'SCHEDULE',
        description: 'SCHEDULE_DESC',
        icon: 'time'
      });
      
      // Add Publish Now option
      this.publishOptions.unshift({
        id: 'publish',
        value: 'published',
        label: 'PUBLISH_NOW',
        description: 'PUBLISH_NOW_DESC',
        icon: 'send'
      });
      
      this.hasOnlyTwoOptions = false;
    } else {
      // If user is not active, we only have one option, but still set hasOnlyTwoOptions flag
      // This will make the option take full width
      this.hasOnlyTwoOptions = true;
    }
    
    console.log('Final publish options:', this.publishOptions);
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