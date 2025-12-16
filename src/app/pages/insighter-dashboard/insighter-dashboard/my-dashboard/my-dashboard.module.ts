import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MyDashboardComponent } from './my-dashboard.component';
import { TranslationModule } from 'src/app/modules/i18n';
import { KnowledgeTypesStatisticsComponent } from './knowledge-types-statistics/knowledge-types-statistics.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ChartModule } from 'primeng/chart';
import { ClientMyDashboardComponent } from './client-my-dashboard/client-my-dashboard.component';
import { CompanyMyDashboardComponent } from './company-my-dashboard/company-my-dashboard.component';
import { InsighterMyDashboardComponent } from './insighter-my-dashboard/insighter-my-dashboard.component';
import { UpcomingMeetingsCalendarComponent } from './upcoming-sent-meetings/upcoming-meetings-calendar.component';
import { WidgetsRowComponent } from './widgets-row/widgets-row.component';
import { CompanyMeetingsStatisticsComponent } from './company-meetings-statistics/company-meetings-statistics.component';
import { AgreementModalComponent } from 'src/app/reusable-components/agreement-modal/agreement-modal.component';

const routes: Routes = [
  {
    path: '',
    component: MyDashboardComponent
  }
];

@NgModule({
  declarations: [
    MyDashboardComponent,
    KnowledgeTypesStatisticsComponent,
    ClientMyDashboardComponent,
    CompanyMyDashboardComponent,
    InsighterMyDashboardComponent,
    WidgetsRowComponent,
    UpcomingMeetingsCalendarComponent,
    CompanyMeetingsStatisticsComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TranslationModule,
    NgApexchartsModule,
    ChartModule,
    AgreementModalComponent
  ],
  schemas: [NO_ERRORS_SCHEMA]
})
export class MyDashboardModule { } 
