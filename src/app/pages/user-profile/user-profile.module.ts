import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { UserProfileRoutingModule } from './user-profile-routing.module';
import { ProfileComponent } from './profile.component';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { DropdownMenusModule } from 'src/app/_metronic/partials';
import { ProfileHeaderComponent } from './profile-header/profile-header.component';
import { ActionButtonsComponent } from './action-buttons/action-buttons.component';
import { NavigationTabsComponent } from './navigation-tabs/navigation-tabs.component';


@NgModule({
  declarations: [
    ProfileComponent,
    ProfileHeaderComponent,
    ActionButtonsComponent,
    NavigationTabsComponent
  ],
  imports: [
    CommonModule,
    UserProfileRoutingModule,
    SharedModule,
    DropdownMenusModule
  ]
})
export class UserProfileModule { }
