import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserProfileRoutingModule } from './user-profile-routing.module';
import { ProfileComponent } from './profile.component';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { DropdownMenusModule } from 'src/app/_metronic/partials';
import { ProfileHeaderComponent } from './profile-header/profile-header.component';
import { ActionButtonsComponent } from './action-buttons/action-buttons.component';
import { NavigationTabsComponent } from './navigation-tabs/navigation-tabs.component';
import { TranslationModule } from 'src/app/modules/i18n';
import { OverviewComponent } from './profile-pages/overview/overview.component';
import { AccountSettingsComponent } from './profile-pages/account-settings/account-settings.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ProgressBarModule } from 'primeng/progressbar';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { TreeSelectModule } from 'primeng/treeselect';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';


@NgModule({
  declarations: [
    ProfileComponent,
    ProfileHeaderComponent,
    ActionButtonsComponent,
    NavigationTabsComponent,
    AccountSettingsComponent,
    OverviewComponent
  ],
  imports: [
    CommonModule,
    UserProfileRoutingModule,
    SharedModule,
    ReactiveFormsModule,
    ToastModule,
    FileUploadModule,
    ProgressBarModule,
    ButtonModule,
    DropdownModule,
    DialogModule,
    TreeSelectModule,
    MultiSelectModule,
    TranslationModule,
    DropdownMenusModule
  ],
  providers: [MessageService] 
})
export class UserProfileModule { }
