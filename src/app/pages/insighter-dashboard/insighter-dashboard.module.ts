import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InsighterDashboardRoutingModule } from './insighter-dashboard-routing.module';
import { InsighterDashboardComponent } from './insighter-dashboard/insighter-dashboard.component';
import { AppFooterComponent } from 'src/app/reusable-components/app-footer/app-footer.component';
import { TranslationModule } from 'src/app/modules/i18n';
import { ToastModule } from 'primeng/toast';
import { OverviewStatisticsComponent } from './insighter-dashboard/statistics/overview-statistics/overview-statistics.component';
import { AccountSettingsHeaderComponent } from './insighter-dashboard/statistics/account-settings-header/account-settings-header.component';
import { KnowledgeStatisticsComponent } from './insighter-dashboard/statistics/knowledge-statistics/knowledge-statistics.component';
import { RequestsStatisticsComponent } from './insighter-dashboard/statistics/requests-statistics/requests-statistics.component';
import { CountUpDirective } from 'src/app/directives/countup/count-up.directive';
import { CompanyStatisticsComponent } from './insighter-dashboard/statistics/company-statistics/company-statistics.component';
import { DownloadsStatisticsComponent } from './insighter-dashboard/statistics/downloads-statistics/downloads-statistics.component';
import { ConsultingScheduleHeaderComponent } from './insighter-dashboard/statistics/consulting-schedule-header/consulting-schedule-header.component';
import { MeetingsStatisticsComponent } from './insighter-dashboard/my-meetings/meetings-statistics/meetings-statistics.component';

@NgModule({
  declarations: [
    InsighterDashboardComponent,
    OverviewStatisticsComponent,
    RequestsStatisticsComponent,
    KnowledgeStatisticsComponent,
    AccountSettingsHeaderComponent,
    CompanyStatisticsComponent,
    DownloadsStatisticsComponent,
    ConsultingScheduleHeaderComponent,
    MeetingsStatisticsComponent
  ],
  imports: [
    CommonModule,
    AppFooterComponent,
    CountUpDirective,
    InsighterDashboardRoutingModule,
    TranslationModule,
    ToastModule
  ]
})
export class InsighterDashboardModule { }
