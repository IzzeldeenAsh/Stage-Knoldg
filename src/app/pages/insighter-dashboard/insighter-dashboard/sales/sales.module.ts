import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SalesComponent } from './sales.component';
import { SoldKnowledgeDetailsComponent } from './sold-knowledge-details/sold-knowledge-details.component';
import { SoldMeetingDetailsComponent } from './sold-meeting-details/sold-meeting-details.component';
import { InsighterFilterComponent } from './insighter-filter/insighter-filter.component';
import { OrderDetailsDialogComponent } from './order-details-dialog/order-details-dialog.component';
import { MeetingOrderDetailsDialogComponent } from './meeting-order-details-dialog/meeting-order-details-dialog.component';
import { TranslationModule } from 'src/app/modules/i18n';
import { ChartModule } from 'primeng/chart';
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { InsighterDashboardSharedModule } from '../shared/shared.module';

const routes: Routes = [
  {
    path: '',
    component: SalesComponent
  }
];

@NgModule({
  declarations: [
    SalesComponent,
    SoldKnowledgeDetailsComponent,
    SoldMeetingDetailsComponent,
    InsighterFilterComponent,
    OrderDetailsDialogComponent,
    MeetingOrderDetailsDialogComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TranslationModule,
    ChartModule,
    PaginatorModule,
    TooltipModule,
    DropdownModule,
    DialogModule,
    FormsModule,
    SharedModule,
    InsighterDashboardSharedModule
  ]
})
export class SalesModule { }