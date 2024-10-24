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
import { DashboardSideBarComponent } from "./dashboard-side-bar/dashboard-side-bar.component";
import { DepartmentComponent } from './dashboard/departments/departments.component';
import { TableModule } from 'primeng/table';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { MessagesModule } from 'primeng/messages';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
@NgModule({
  declarations: [
    DashboardComponent,
    CompanySettingsComponent,
    DashboardStatsBarComponent,
    AdminNotificationsComponent,
    DashboardSideBarComponent,
    DepartmentComponent,
  ],
  imports: [
    CommonModule,
    DialogModule, ButtonModule, 
    TooltipModule,
    ProgressBarModule,
    DashbordRoutingModule,
    InlineSVGModule,
    InputTextModule,
    FormsModule,
    CardModule,
    MessagesModule,
    TableModule,
    NgApexchartsModule,
    
]
})
export class DashbordModule { }
