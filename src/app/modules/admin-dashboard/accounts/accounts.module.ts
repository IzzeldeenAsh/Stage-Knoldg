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
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';


@NgModule({
  declarations: [
    AccountsComponent,
    StaffComponent,
    RolesComponent,
    PermissionsComponent
  ],
  imports: [
    CommonModule,
    AccountsRoutingModule,
    MessagesModule,
    TableModule,
    DialogModule, ButtonModule, 
    ProgressBarModule,
    InputTextModule,
    FormsModule,
    DropdownModule,
  ]
})
export class AccountsModule { }
