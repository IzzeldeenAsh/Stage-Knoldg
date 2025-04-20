import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MyCompanyRoutingModule } from './my-company-routing.module';
import { MyCompanyComponent } from './my-company/my-company.component';
import { TranslationModule } from 'src/app/modules/i18n';
import { EmployeeStatusStatisticsComponent } from './employee-status-statistics/employee-status-statistics.component';

// PrimeNG Modules
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { AvatarModule } from 'primeng/avatar';
import { Paginator, PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { NgApexchartsModule } from 'ng-apexcharts';

@NgModule({
  declarations: [
    MyCompanyComponent,
    EmployeeStatusStatisticsComponent
  ],

  imports: [
    CommonModule,
    MyCompanyRoutingModule,
    TranslationModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    PaginatorModule,
    ButtonModule,
    ToastModule,
    AvatarModule,
    TooltipModule,
    ConfirmDialogModule,
    NgApexchartsModule
  ],
  providers: [
    ConfirmationService
  ]
})
export class MyCompanyModule { }
