import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UsersRoutingModule } from './users-routing.module';
import { UsersMainComponent } from './users-main/users-main.component';
import { UsersListComponent } from './users-main/users-list/users-list.component';
import { BusinessOwnerListComponent } from './users-main/users-list/business-owner-list/business-owner-list.component';
import { InlineSVGModule } from 'ng-inline-svg-2';


@NgModule({
  declarations: [
    UsersMainComponent,
    UsersListComponent,
    BusinessOwnerListComponent
  ],
  imports: [
    CommonModule,
    UsersRoutingModule,
    InlineSVGModule
  ]
})
export class UsersModule { }
