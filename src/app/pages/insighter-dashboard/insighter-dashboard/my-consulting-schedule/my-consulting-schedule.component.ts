import { Component, OnInit, signal, computed, inject, Injector } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { BaseComponent } from 'src/app/modules/base.component';
import { ConsultingScheduleService, DayAvailability, AvailabilityException, TimeSlot } from 'src/app/services/consulting-schedule.service';

@Component({
  selector: 'app-my-consulting-schedule',
  templateUrl: './my-consulting-schedule.component.html',
  styleUrls: ['./my-consulting-schedule.component.scss']
})
export class MyConsultingScheduleComponent extends BaseComponent implements OnInit {
  
  // Signals
  loading = signal(false);
  saving = signal(false);
  availability = signal<DayAvailability[]>([]);
  availabilityObject = signal<{[key: string]: DayAvailability}>({});
  exceptions = signal<AvailabilityException[]>([]);

  // Form
  scheduleForm!: FormGroup;
  
  // Days of the week
  weekDays = [
    { key: 'monday', label: 'CONSULTING_SCHEDULE.DAYS.MONDAY' },
    { key: 'tuesday', label: 'CONSULTING_SCHEDULE.DAYS.TUESDAY' },
    { key: 'wednesday', label: 'CONSULTING_SCHEDULE.DAYS.WEDNESDAY' },
    { key: 'thursday', label: 'CONSULTING_SCHEDULE.DAYS.THURSDAY' },
    { key: 'friday', label: 'CONSULTING_SCHEDULE.DAYS.FRIDAY' },
    { key: 'saturday', label: 'CONSULTING_SCHEDULE.DAYS.SATURDAY' },
    { key: 'sunday', label: 'CONSULTING_SCHEDULE.DAYS.SUNDAY' }
  ];

  constructor(
    private fb: FormBuilder,
    private consultingScheduleService: ConsultingScheduleService,
    injector: Injector,
  ) {
    super(injector);
    this.initializeForm();
  }

  // RTL support method
  isRtl(): boolean {
    return document.documentElement.getAttribute('dir') === 'rtl';
  }

  // Custom validator for time slots - ensures minutes match between start and end times
  private perfectHourValidator(control: AbstractControl): ValidationErrors | null {
    const group = control as FormGroup;
    const startTime = group.get('start_time')?.value;
    const endTime = group.get('end_time')?.value;

    if (!startTime || !endTime) {
      return null; // Let required validators handle empty values
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    
    // Check if end time minutes match start time minutes
    if (startDate.getMinutes() !== endDate.getMinutes()) {
      return { 'perfectHour': { 
        message: 'Start time and end time minutes must match',
        startMinutes: startDate.getMinutes(),
        endMinutes: endDate.getMinutes()
      }};
    }
    
    // Check if end time is after start time
    if (endDate <= startDate) {
      return { 'invalidTimeRange': { 
        message: 'End time must be after start time'
      }};
    }

    return null;
  }

  // Synchronize end time minutes with start time minutes
  synchronizeEndTimeMinutes(control: FormGroup): void {
    const startTimeControl = control.get('start_time');
    const endTimeControl = control.get('end_time');
    
    if (!startTimeControl || !endTimeControl || !startTimeControl.value) return;
    
    const startDate = new Date(startTimeControl.value);
    let endDate = endTimeControl.value ? new Date(endTimeControl.value) : new Date();
    
    // Set end time minutes to match start time minutes
    endDate.setMinutes(startDate.getMinutes());
    
    // If end time is now before or equal to start time, add one hour
    if (endDate <= startDate) {
      endDate = new Date(startDate);
      endDate.setHours(endDate.getHours() + 1);
    }
    
    // Update end time value
    endTimeControl.setValue(endDate);
  }

  ngOnInit(): void {
    this.initializeWithDefaultDays();
    this.loadScheduleData();
  }

  private initializeForm(): void {
    this.scheduleForm = this.fb.group({
      availability: this.fb.array([]),
      exceptions: this.fb.array([])
    });
  }

  get availabilityFormArray(): FormArray {
    return this.scheduleForm.get('availability') as FormArray;
  }

  get exceptionsFormArray(): FormArray {
    return this.scheduleForm.get('exceptions') as FormArray;
  }

  private loadScheduleData(): void {
    this.loading.set(true);
    
    this.consultingScheduleService.getScheduleAvailability().subscribe({
      next: (response) => {
        // Check if response.data.availability is an array or an object
        if (Array.isArray(response.data.availability)) {
          this.availability.set(response.data.availability);
        } else {
          // If it's an object, convert it to an array for backward compatibility
          this.availabilityObject.set(response.data.availability);
          const availabilityArray: DayAvailability[] = this.convertAvailabilityObjectToArray(response.data.availability);
          this.availability.set(availabilityArray);
        }
        
        this.exceptions.set(response.data.availability_exceptions);
        this.buildForm();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading schedule:', error);
        // Don't show error message, just use default data
        // this.messageService.add({
        //   severity: 'error',
        //   summary: 'Error',
        //   detail: 'Failed to load schedule data'
        // });
        this.loading.set(false);
      }
    });
  }
  
  /**
   * Converts the availability object format to an array format
   * @param availabilityObj The availability object with days as keys
   * @returns Array of day availability objects
   */
  private convertAvailabilityObjectToArray(availabilityObj: {[key: string]: DayAvailability}): DayAvailability[] {
    if (!availabilityObj) return [];
    
    return Object.keys(availabilityObj).map(dayKey => {
      const dayData = availabilityObj[dayKey];
      return {
        day: dayData.day,
        active: dayData.active,
        times: dayData.times || []
      };
    });
  }

  private buildForm(): void {
    // Clear existing form arrays
    this.availabilityFormArray.clear();
    this.exceptionsFormArray.clear();

    // Build availability form controls
    this.availability().forEach(day => {
      const dayGroup = this.createDayFormGroup(day);
      this.availabilityFormArray.push(dayGroup);
    });

    // Build exceptions form controls
    this.exceptions().forEach(exception => {
      const exceptionGroup = this.createExceptionFormGroup(exception);
      this.exceptionsFormArray.push(exceptionGroup);
    });
  }

  private createDayFormGroup(day: DayAvailability): FormGroup {
    const timesArray = this.fb.array(
      day.times.map(time => this.createTimeSlotFormGroup(time))
    );

    return this.fb.group({
      day: [day.day],
      active: [day.active],
      times: timesArray
    });
  }

  private createTimeSlotFormGroup(timeSlot: TimeSlot): FormGroup {
    const group = this.fb.group({
      start_time: [this.parseTimeString(timeSlot.start_time), Validators.required],
      end_time: [this.parseTimeString(timeSlot.end_time), Validators.required],
      rate: [timeSlot.rate || 0, Validators.required]
    }, { validators: this.perfectHourValidator.bind(this) });
    
    // Add subscription to start_time changes to synchronize end_time minutes
    const startTimeControl = group.get('start_time');
    startTimeControl?.valueChanges.subscribe(() => {
      this.synchronizeEndTimeMinutes(group);
    });
    
    return group;
  }

  private createExceptionFormGroup(exception: AvailabilityException): FormGroup {
    const group = this.fb.group({
      exception_date: [exception.exception_date, Validators.required],
      start_time: [this.parseTimeString(exception.start_time), Validators.required],
      end_time: [this.parseTimeString(exception.end_time), Validators.required],
      rate: [exception.rate || 0, Validators.required]
    }, { validators: this.perfectHourValidator.bind(this) });
    
    // Add subscription to start_time changes to synchronize end_time minutes
    const startTimeControl = group.get('start_time');
    startTimeControl?.valueChanges.subscribe(() => {
      this.synchronizeEndTimeMinutes(group);
    });
    
    return group;
  }

  // Helper method to parse time string to Date object for PrimeNG Calendar
  private parseTimeString(timeString: string): Date | null {
    if (!timeString) return null;
    
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    return date;
  }

  // Helper method to convert Date object to time string (HH:MM format)
  private formatTimeString(date: Date | string): string {
    if (!date) return '';
    
    if (typeof date === 'string') return date;
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  // Helper method to split time range into hourly slots
  private splitTimeRangeIntoHours(startTime: string, endTime: string): TimeSlot[] {
    const slots: TimeSlot[] = [];
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startDate = new Date();
    startDate.setHours(startHour, startMinute, 0, 0);
    
    const endDate = new Date();
    endDate.setHours(endHour, endMinute, 0, 0);
    
    const current = new Date(startDate);
    
    while (current < endDate) {
      const slotStart = this.formatTimeString(current);
      
      // Move to next hour
      current.setHours(current.getHours() + 1);
      
      // Don't exceed the end time
      const slotEnd = current > endDate ? this.formatTimeString(endDate) : this.formatTimeString(current);
      
      if (slotStart !== slotEnd) {
        slots.push({
          start_time: slotStart,
          end_time: slotEnd,
          rate: 0 // Will be set from the form data
        });
      }
    }
    
    return slots;
  }

  // Day availability methods
  onDayToggle(dayIndex: number): void {
    const dayGroup = this.availabilityFormArray.at(dayIndex) as FormGroup;
    const isActive = dayGroup.get('active')?.value;
    const timesArray = dayGroup.get('times') as FormArray;
    
    if (!isActive) {
      // Clear times when day is deactivated
      timesArray.clear();
    } else {
      // Add a default time slot when day is activated
      if (timesArray.length === 0) {
        const newTimeSlot = this.createTimeSlotFormGroup({ start_time: '09:00', end_time: '10:00', rate: 50 });
        timesArray.push(newTimeSlot);
      }
    }
  }

  addTimeSlot(dayIndex: number): void {
    const dayGroup = this.availabilityFormArray.at(dayIndex) as FormGroup;
    const timesArray = dayGroup.get('times') as FormArray;
    
    const newTimeSlot = this.createTimeSlotFormGroup({ start_time: '09:00', end_time: '10:00', rate: 50 });
    timesArray.push(newTimeSlot);
  }

  removeTimeSlot(dayIndex: number, timeIndex: number): void {
    const dayGroup = this.availabilityFormArray.at(dayIndex) as FormGroup;
    const timesArray = dayGroup.get('times') as FormArray;
    timesArray.removeAt(timeIndex);
  }

  getTimesFormArray(dayIndex: number): FormArray {
    const dayGroup = this.availabilityFormArray.at(dayIndex) as FormGroup;
    return dayGroup.get('times') as FormArray;
  }

  // Exception methods
  addException(): void {
    const newException = this.createExceptionFormGroup({
      exception_date: '',
      start_time: '09:00',
      end_time: '10:00',
      rate: 50
    });
    this.exceptionsFormArray.push(newException);
  }

  removeException(index: number): void {
    this.exceptionsFormArray.removeAt(index);
  }

  // Save method
  onSave(): void {
    if (this.scheduleForm.valid) {
      this.saving.set(true);
      
      const formValue = this.scheduleForm.value;
      const processedData = this.processFormData(formValue);
      
      this.consultingScheduleService.updateScheduleAvailability(processedData).subscribe({
        next: (response) => {
        if(this.lang === 'en'){
          this.showSuccess('Success','Schedule updated successfully');
        }else{
          this.showSuccess('Success','تم تحديث الجدول بنجاح');
        }
          this.saving.set(false);
        },
        error: (error) => {
          console.error('Error saving schedule:', error);
          this.handleServerErrors(error);
          this.saving.set(false);
        }
      });
    } else {
      if(this.lang === 'en'){
        this.showError('Error','Please fill in all required fields');
      }else{
        this.showError('يرجى إدخال جميع الحقول المطلوبة');
      }
    }
  }

  // Handle server errors
  private handleServerErrors(error: any) {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          if (Array.isArray(messages)) {
            this.showError('Error',messages.join(", "));
          } else {
            this.showError('Error',messages);
          }
        }
      }
    } else if (error.error && error.error.message) {
      // Handle single error message
      this.showError('Error',error.error.message);
    } else {
      // Fallback error message
      if(this.lang === 'en'){
        this.showError('Failed to save schedule');
      }else{
        this.showError('فشل تحديث الجدول');
      }
    }
  }

  // Process form data to convert dates to time strings and split into hourly slots
  private processFormData(formValue: any): any {
    const processedData: {
      availability: DayAvailability[],
      availability_exceptions: AvailabilityException[]
    } = {
      availability: [],
      availability_exceptions: []
    };

    // Process availability - convert to array format expected by the API
    if (formValue.availability) {
      formValue.availability.forEach((day: any) => {
        // Create the day entry with its data
        const dayEntry: DayAvailability = {
          day: day.day,
          active: day.active,
          times: [] as TimeSlot[]
        };
        
        // Process times if the day is active and has time slots
        if (day.active && day.times && day.times.length > 0) {
          const processedTimes: TimeSlot[] = [];
          
          day.times.forEach((timeSlot: any) => {
            const startTime = this.formatTimeString(timeSlot.start_time);
            const endTime = this.formatTimeString(timeSlot.end_time);
            const rate = timeSlot.rate || 0;
            
            if (startTime && endTime) {
              // Add the time slot with rate
              processedTimes.push({
                start_time: startTime,
                end_time: endTime,
                rate: rate
              });
            }
          });
          
          dayEntry.times = processedTimes;
        }
        
        // Add to the availability array
        processedData.availability.push(dayEntry);
      });
    }

    // Process exceptions
    if (formValue.exceptions) {
      processedData.availability_exceptions = formValue.exceptions.map((exception: any) => {
        // Format the date as YYYY-MM-DD with no time component
        let formattedDate;
        if (exception.exception_date instanceof Date) {
          // Format date as YYYY-MM-DD
          const year = exception.exception_date.getFullYear();
          const month = String(exception.exception_date.getMonth() + 1).padStart(2, '0');
          const day = String(exception.exception_date.getDate()).padStart(2, '0');
          formattedDate = `${year}-${month}-${day}`;
        } else {
          // If it's already a string, make sure it's just the date part
          formattedDate = typeof exception.exception_date === 'string' 
            ? exception.exception_date.split('T')[0] 
            : exception.exception_date;
        }
        
        return {
          exception_date: formattedDate,
          start_time: this.formatTimeString(exception.start_time),
          end_time: this.formatTimeString(exception.end_time),
          rate: exception.rate || 0
        };
      });
    }

    return processedData;
  }

  private initializeWithDefaultDays(): void {
    // Initialize with default days structure
    const defaultAvailability: DayAvailability[] = [
      { day: 'monday', active: false, times: [] },
      { day: 'tuesday', active: false, times: [] },
      { day: 'wednesday', active: false, times: [] },
      { day: 'thursday', active: false, times: [] },
      { day: 'friday', active: false, times: [] },
      { day: 'saturday', active: false, times: [] },
      { day: 'sunday', active: false, times: [] }
    ];
    
    this.availability.set(defaultAvailability);
    this.exceptions.set([]);
    this.buildForm();
  }
} 