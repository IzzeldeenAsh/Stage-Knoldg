import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressBarModule } from 'primeng/progressbar';
import { DashbordRoutingModule } from './dashbord-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import { CompanySettingsComponent } from './company-settings/company-settings.component';
import { DashboardStatsBarComponent } from './dashboard/dashboard-stats-bar/dashboard-stats-bar.component';
import { AdminNotificationsComponent } from './dashboard/admin-notifications/admin-notifications.component';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { DepartmentComponent } from './dashboard/departments/departments.component';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessagesModule } from 'primeng/messages';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { PositionsComponent } from './dashboard/positions/positions.component';
import { CountriesComponent } from './dashboard/countries/countries.component';
import { RegionsComponent } from './dashboard/regions/regions.component';
import { DropdownModule } from 'primeng/dropdown';
import { ConsultingFieldsComponent } from './dashboard/consulting-fields/consulting-fields.component';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
@NgModule({
  declarations: [
    DashboardComponent,
    CompanySettingsComponent,
    DashboardStatsBarComponent,
    AdminNotificationsComponent,
    CountriesComponent,
    DepartmentComponent,
    ConsultingFieldsComponent,
    RegionsComponent,
    PositionsComponent
  ],
  imports: [
    CommonModule,
    DialogModule, ButtonModule, 
    TooltipModule,
    ProgressBarModule,
    DashbordRoutingModule,
    InlineSVGModule,
    DropdownModule,
    InputTextModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule,
    ToastModule,
    MessagesModule,
    TableModule,
    NgApexchartsModule,
    
]
,providers:[MessageService]

})
export class DashbordModule { }
