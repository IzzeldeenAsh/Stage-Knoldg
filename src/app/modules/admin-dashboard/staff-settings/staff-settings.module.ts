import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StaffSettingsRoutingModule } from './staff-settings-routing.module';
import { StaffSettingsComponent } from './staff-settings/staff-settings.component';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ChangePasswordComponent } from './staff-settings/change-password/change-password.component';
import { MessagesModule } from 'primeng/messages';
import { FormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    StaffSettingsComponent,
    ChangePasswordComponent
  ],
  imports: [
    CommonModule,
    MessagesModule,
    FormsModule,
    ToastModule,
    StaffSettingsRoutingModule
  ]
})
export class StaffSettingsModule { }
