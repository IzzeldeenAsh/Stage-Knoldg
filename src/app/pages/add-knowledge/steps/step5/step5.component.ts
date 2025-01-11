import { Component, Injector, Input, OnInit } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';
import { ICreateKnowldege } from '../../create-account.helper';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';

@Component({
  selector: 'app-step5',
  templateUrl: './step5.component.html',
  styleUrls: ['./step5.component.scss']
})
export class Step5Component extends BaseComponent implements OnInit {
  @Input("updateParentModel") updateParentModel: (
    part: Partial<ICreateKnowldege>,
    isFormValid: boolean
  ) => void;
  @Input() defaultValues: Partial<ICreateKnowldege>;
  publishForm: FormGroup;
  scheduleForm: FormGroup;
  minDate:Date = new Date();
  publishOptions = [
    {
      id: 'publishNow',
      value: 'now',
      label: 'PUBLISH_NOW',
      icon: 'fas fa-paper-plane',
      description: 'PUBLISH_NOW_DESC'
    },
    {
      id: 'scheduled',
      value: 'scheduled',
      label: 'SCHEDULE',
      icon: 'fas fa-calendar-alt',
      description: 'SCHEDULE_DESC'
    },
    {
      id: 'draft',
      value: 'draft',
      label: 'SAVE_AS_DRAFT',
      icon: 'fas fa-save',
      description: 'SAVE_AS_DRAFT_DESC'
    }
  ];

  constructor(injector: Injector, private fb: FormBuilder) {
    super(injector);
  }

  ngOnInit(): void {
    this.publishForm = new FormGroup({
      publishOption: new FormControl('', Validators.required),
      publishDate: new FormControl('', Validators.required),
      publishTime: new FormControl('00:00', Validators.required)
    });
    this.updateParentValues()
    // Subscribe to publishOption changes
    this.publishForm.get('publishOption')?.valueChanges.subscribe(value => {
      const dateControl = this.publishForm.get('publishDate');
      const timeControl = this.publishForm.get('publishTime');

      if (value === 'scheduled') {
        dateControl?.setValidators(Validators.required);
        timeControl?.setValidators(Validators.required);
      } else {
        dateControl?.clearValidators();
        timeControl?.clearValidators();
      }
      
      dateControl?.updateValueAndValidity();
      timeControl?.updateValueAndValidity();

      // Update parent model whenever publish option changes
      this.updateParentModel(
        { 
          publish_status: value,
          publish_date_time: this.getFormattedDateTime() || ''
        }, 
        this.checkForm()
      );
    });

    // Subscribe to date/time changes
    this.publishForm.get('publishDate')?.valueChanges.subscribe(() => this.updateParentValues());
    this.publishForm.get('publishTime')?.valueChanges.subscribe(() => this.updateParentValues());

    // Add these debug logs
    this.publishForm.valueChanges.subscribe(value => {
      console.log('Form value changed:', value);
    });

    this.publishForm.get('publishDate')?.valueChanges.subscribe(value => {
      console.log('Date value changed:', value);
    });
  }

  private getFormattedDateTime(): string | null {
    const option = this.publishForm.get('publishOption')?.value;
    if (option !== 'scheduled') return null;

    const date = this.publishForm.get('publishDate')?.value;
    const time = this.publishForm.get('publishTime')?.value || '00:00';

    if (!date) return null;

    const dateObj = new Date(`${date}T${time}`);
    
    const year = dateObj.getFullYear();
    const month = this.padZero(dateObj.getMonth() + 1);
    const day = this.padZero(dateObj.getDate());
    const hours = this.padZero(dateObj.getHours());
    const minutes = this.padZero(dateObj.getMinutes());
    const seconds = this.padZero(dateObj.getSeconds());

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  private padZero(num: number): string {
    return num < 10 ? `0${num}` : `${num}`;
  }

  private updateParentValues() {
    this.updateParentModel(
      {
        publish_status: this.publishForm.get('publishOption')?.value,
        publish_date_time: this.getFormattedDateTime() || ''
      },
      this.checkForm()
    );
  }

  confirmSchedule() {
    if (this.scheduleForm.valid) {
      const scheduledDateTime = `${this.scheduleForm.value.publishDate} ${this.scheduleForm.value.publishTime}`;
      console.log('Scheduled Publishing At:', scheduledDateTime);
      // Implement your scheduling logic here

      // Reset the schedule form and publish option
      this.publishForm.get('publishOption')?.reset();
      this.scheduleForm.reset();
    }
  }

  saveAsDraft() {
    // Handle save as draft logic
    console.log('Saving as Draft');
    // Implement your save as draft logic here
  }

  checkForm(): boolean {
    const publishOption = this.publishForm.get('publishOption')?.value;
    console.log('Form Valid:', this.publishForm.valid);
    console.log('Form Values:', this.publishForm.value);
    console.log('Form Errors:', this.publishForm.errors);
    console.log('Date Control Valid:', this.publishForm.get('publishDate')?.valid);
    console.log('Time Control Valid:', this.publishForm.get('publishTime')?.valid);
    
    if (publishOption === 'scheduled') {
      return this.publishForm.valid && 
             !!this.publishForm.get('publishDate')?.value && 
             !!this.publishForm.get('publishTime')?.value;
    }
    return this.publishForm.valid;
  }

  onDateChange(event: any) {
    const dateValue = event.target.value;
    console.log('Raw date value:', dateValue);
    this.publishForm.patchValue({
      publishDate: dateValue
    }, { emitEvent: true });
  }
}