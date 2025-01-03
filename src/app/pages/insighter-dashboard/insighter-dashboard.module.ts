import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InsighterDashboardRoutingModule } from './insighter-dashboard-routing.module';
import { InsighterDashboardComponent } from './insighter-dashboard/insighter-dashboard.component';
import { AppFooterComponent } from 'src/app/reusable-components/app-footer/app-footer.component';
import { MyDashboardComponent } from './insighter-dashboard/my-dashboard/my-dashboard.component';
import { MyRequestsComponent } from './insighter-dashboard/my-requests/my-requests.component';
import { MyKnowledgeComponent } from './insighter-dashboard/my-knowledge/my-knowledge.component';
import { AccountSettingsComponent } from './insighter-dashboard/account-settings/account-settings.component';
import { TranslationModule } from 'src/app/modules/i18n';
import { UpgradeToCompanyComponent } from './insighter-dashboard/account-settings/upgrade-to-company/upgrade-to-company.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { ProgressBarModule } from 'primeng/progressbar';
import { DialogModule } from 'primeng/dialog';
import { AccountSettingsHeaderComponent } from './insighter-dashboard/statistics/account-settings-header/account-settings-header.component';
import { KnowledgeStatisticsComponent } from './insighter-dashboard/statistics/knowledge-statistics/knowledge-statistics.component';
import { RequestsStatisticsComponent } from './insighter-dashboard/statistics/requests-statistics/requests-statistics.component';
import { OverviewStatisticsComponent } from './insighter-dashboard/statistics/overview-statistics/overview-statistics.component';
import { GeneralSettingsComponent } from './insighter-dashboard/account-settings/general-settings/general-settings.component';
import { ActivateAccountComponent } from './insighter-dashboard/account-settings/activate-account/activate-account.component';
import { ReactivateDialogComponent } from './insighter-dashboard/account-settings/activate-account/reactivate-dialog/reactivate-dialog.component';
import { TransferDialogComponent } from './insighter-dashboard/account-settings/transfer-dialog/transfer-dialog.component';
import { DeactivateDialogComponent } from './insighter-dashboard/account-settings/deactivate-dialog/deactivate-dialog.component';
import { DeleteDialogComponent } from './insighter-dashboard/account-settings/delete-dialog/delete-dialog.component';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { ResetPasswordComponent } from './insighter-dashboard/account-settings/reset-password/reset-password.component';
import { ToastModule } from 'primeng/toast';

@NgModule({
  declarations: [
    InsighterDashboardComponent,
    MyDashboardComponent,
    MyRequestsComponent,
    ReactivateDialogComponent,
    TransferDialogComponent,
    DeactivateDialogComponent,
    DeleteDialogComponent,
    MyKnowledgeComponent,
    UpgradeToCompanyComponent,
    AccountSettingsComponent,
    AccountSettingsHeaderComponent,
    KnowledgeStatisticsComponent,
    RequestsStatisticsComponent,
    GeneralSettingsComponent,
    ActivateAccountComponent,
    OverviewStatisticsComponent,
    ResetPasswordComponent,
    
  ],
  imports: [
    CommonModule,
    AppFooterComponent,
    InsighterDashboardRoutingModule,
    ReactiveFormsModule,
    ToastModule,
    ProgressBarModule,
    FormsModule,
    DialogModule,
    DynamicDialogModule,
    TooltipModule,
    TranslationModule,
  ]
})
export class InsighterDashboardModule { }
