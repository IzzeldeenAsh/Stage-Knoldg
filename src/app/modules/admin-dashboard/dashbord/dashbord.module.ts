import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashbordRoutingModule } from './dashbord-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { TablesWidget10Component } from './tables-widget10/tables-widget10.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import { MyCasesChartComponent } from './my-cases-chart/my-cases-chart.component';
import { MyCasesChartTwoComponent } from './my-cases-chart-two/my-cases-chart-two.component';
import { MessagsComponent } from './messags/messags.component';
import { ReportsComponent } from './reports/reports.component';
import { CompanySettingsComponent } from './company-settings/company-settings.component';
import { RevenueStatisticsComponent } from './dashboard/revenue-statistics/revenue-statistics.component';
import { UsersStatisticsComponent } from './dashboard/users-statistics/users-statistics.component';
import { SummaryComponent } from './dashboard/summary/summary.component';
import { DashboardStatsBarComponent } from './dashboard/dashboard-stats-bar/dashboard-stats-bar.component';
import { AdminNotificationsComponent } from './dashboard/admin-notifications/admin-notifications.component';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { DashboardSideBarComponent } from "./dashboard-side-bar/dashboard-side-bar.component";


@NgModule({
  declarations: [
    DashboardComponent,
    TablesWidget10Component,
    MyCasesChartComponent,
    MyCasesChartTwoComponent,
    MessagsComponent,
    ReportsComponent,
    CompanySettingsComponent,
    RevenueStatisticsComponent,
    UsersStatisticsComponent,
    DashboardStatsBarComponent,
    SummaryComponent,
    AdminNotificationsComponent,
  ],
  imports: [
    CommonModule,
    DashbordRoutingModule,
    InlineSVGModule,
    NgApexchartsModule,
    DashboardSideBarComponent
]
})
export class DashbordModule { }
