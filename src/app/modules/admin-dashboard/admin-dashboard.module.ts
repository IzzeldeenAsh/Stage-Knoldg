import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminDashboardRoutingModule } from './admin-dashboard-routing.module';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AsideMenuComponent } from './aside/aside-menu/aside-menu.component';
import { AsideComponent } from './aside/aside.component';
import { ScriptsInitComponent } from './scripts-init/scripts-init.component';
import { UserInnerComponent } from './aside/user-inner/user-inner.component';
import { AdminHeaderComponent } from './admin-header/admin-header.component';
import { TopbarComponent } from './admin-header/topbar/topbar.component';
import { SubHeaderComponent } from './admin-header/sub-header/sub-header.component';
import { InlineSVGModule } from 'ng-inline-svg-2';



@NgModule({
  declarations: [
    AdminDashboardComponent,
    AsideComponent,
    AsideMenuComponent,
    ScriptsInitComponent,
    UserInnerComponent,
    AdminHeaderComponent,
    TopbarComponent,
    SubHeaderComponent,
  ],
  imports: [
    CommonModule,
    AdminDashboardRoutingModule,
    InlineSVGModule
  ]
})
export class AdminDashboardModule { }
//test
