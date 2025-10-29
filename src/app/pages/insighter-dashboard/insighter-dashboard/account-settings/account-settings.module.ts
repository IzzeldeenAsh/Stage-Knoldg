import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { AccountSettingsComponent } from './account-settings.component';
import { TranslationModule } from 'src/app/modules/i18n';
import { UpgradeToCompanyComponent } from './upgrade-to-company/upgrade-to-company.component';
import { GeneralSettingsComponent } from './general-settings/general-settings.component';
import { RolesGuard } from 'src/app/guards/roles-guard/roles-gurad.gurad';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { ReactivateDialogComponent } from './activate-account/reactivate-dialog/reactivate-dialog.component';
import { TransferDialogComponent } from './transfer-dialog/transfer-dialog.component';
import { DeactivateDialogComponent } from './deactivate-dialog/deactivate-dialog.component';
import { DeleteDialogComponent } from './delete-dialog/delete-dialog.component';
import { ActivateAccountComponent } from './activate-account/activate-account.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { CalendarModule } from 'primeng/calendar';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { SharedTreeSelectorComponent } from 'src/app/reusable-components/shared-tree-selector/shared-tree-selector.component';
import { TruncateTextPipe } from 'src/app/pipes/truncate-pipe/truncate-text.pipe';
import { DropdownModule } from 'primeng/dropdown';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CountryDropdownComponent } from 'src/app/reusable-components/country-dropdown/country-dropdown.component';
import { PaymentSettingsComponent } from './payment-settings/payment-settings.component';
import { SettingsTabsComponent } from './settings-tabs/settings-tabs.component';
import { ConsultingScheduleComponent } from './consulting-schedule.component';
import { InsighterDashboardSharedModule } from '../shared/shared.module';

const routes: Routes = [
  {
    path: '',
    component: SettingsTabsComponent,
    children: [
      {
        path: '',
        redirectTo: 'general-settings',
        pathMatch: 'full'
      },
      {
        path: 'company-account',
        component: UpgradeToCompanyComponent,
        canActivate: [RolesGuard],
        data: { roles: ['insighter'] }
      },
      {
        path: 'general-settings',
        component: GeneralSettingsComponent
      },
      {
        path: 'payment-settings',
        component: PaymentSettingsComponent
      },
      {
        path: 'consulting-schedule',
        component: ConsultingScheduleComponent
      }
    ]
  }
];

@NgModule({
  declarations: [
    AccountSettingsComponent,
    SettingsTabsComponent,
    UpgradeToCompanyComponent,
    GeneralSettingsComponent,
    ReactivateDialogComponent,
    PaymentSettingsComponent,
    ConsultingScheduleComponent,
    TransferDialogComponent,
    DeactivateDialogComponent,
    DeleteDialogComponent,
    ActivateAccountComponent,
    ResetPasswordComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TranslationModule,
    FormsModule,
    TooltipModule,
    ReactiveFormsModule,
    DialogModule,
    DynamicDialogModule,
    ToastModule,
    ProgressBarModule,
    CheckboxModule,
    RadioButtonModule,
    CalendarModule,
    ConfirmDialogModule,
    SharedTreeSelectorComponent,
    TruncateTextPipe,
    DropdownModule,
    CountryDropdownComponent,
    InsighterDashboardSharedModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AccountSettingsModule { } 