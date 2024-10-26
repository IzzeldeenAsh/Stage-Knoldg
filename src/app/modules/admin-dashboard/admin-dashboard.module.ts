import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminDashboardRoutingModule } from './admin-dashboard-routing.module';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { ScriptsInitComponent } from './scripts-init/scripts-init.component';
import { AdminHeaderComponent } from './admin-header/admin-header.component';
import { TopbarComponent } from './admin-header/topbar/topbar.component';
import { SubHeaderComponent } from './admin-header/sub-header/sub-header.component';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { DashboardSideBarComponent } from './dashboard-side-bar/dashboard-side-bar.component';
import { SidebarModule } from 'primeng/sidebar';
import { TooltipModule } from 'primeng/tooltip';

@NgModule({
  declarations: [
    AdminDashboardComponent,
    ScriptsInitComponent,
    AdminHeaderComponent,
    TopbarComponent,
    SubHeaderComponent,
    DashboardSideBarComponent,
  ],
  imports: [
    CommonModule,
    AdminDashboardRoutingModule,
    SidebarModule,
    InlineSVGModule,
    TooltipModule
  ]
})
export class AdminDashboardModule { }
//test
