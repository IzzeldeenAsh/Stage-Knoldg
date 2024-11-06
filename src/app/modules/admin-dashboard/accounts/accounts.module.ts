import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AccountsRoutingModule } from './accounts-routing.module';
import { AccountsComponent } from './accounts.component';
import { PermissionsComponent } from './permissions/permissions.component';
import { RolesComponent } from './roles/roles.component';
import { StaffComponent } from './staff/staff.component';
import { MessagesModule } from 'primeng/messages';
import { TableModule } from 'primeng/table';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ProgressBarModule } from 'primeng/progressbar';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { MessageService } from 'primeng/api';
import { CheckboxModule } from 'primeng/checkbox';
import { ChipModule } from 'primeng/chip';
import { EditPermissionsDialogComponent } from './roles/edit-permissions-dialog/edit-permissions-dialog.component';
import { ToastModule } from 'primeng/toast';
import { DialogService } from 'primeng/dynamicdialog';
@NgModule({
  declarations: [
    AccountsComponent,
    StaffComponent,
    EditPermissionsDialogComponent,
    RolesComponent,
    PermissionsComponent
  ],
  imports: [
    CommonModule,
    AccountsRoutingModule,
    CheckboxModule,
    ChipModule,
    MessagesModule,
    ToastModule,
    ReactiveFormsModule,
    TableModule,
    DialogModule, ButtonModule, 
    ProgressBarModule,
    InputTextModule,
    FormsModule,
    DropdownModule,
  ]
  ,providers:[MessageService,DialogService],
  
})
export class AccountsModule { }
