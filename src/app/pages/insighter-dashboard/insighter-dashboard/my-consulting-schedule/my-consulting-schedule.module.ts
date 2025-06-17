import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// PrimeNG Modules
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

// Translation Module
import { TranslationModule } from 'src/app/modules/i18n';

// Components and Routing
import { MyConsultingScheduleRoutingModule } from './my-consulting-schedule-routing.module';
import { MyConsultingScheduleComponent } from './my-consulting-schedule.component';
import { CalendarModule } from 'primeng/calendar';
@NgModule({
  declarations: [
    MyConsultingScheduleComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CheckboxModule,
    CalendarModule,
    ButtonModule,
    ToastModule,
    TranslationModule,
    MyConsultingScheduleRoutingModule
  ],
  providers: [
    MessageService
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MyConsultingScheduleModule { } 