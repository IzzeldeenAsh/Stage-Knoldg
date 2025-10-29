import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyOrdersRoutingModule } from './my-orders-routing.module';
import { MyOrdersComponent } from './my-orders.component';
import { KnowledgeOrdersComponent } from './components/knowledge-orders/knowledge-orders.component';
import { MeetingOrdersComponent } from './components/meeting-orders/meeting-orders.component';
import { OrderDetailsDialogComponent } from './components/order-details-dialog/order-details-dialog.component';
import { MeetingOrderDetailsDialogComponent } from './components/meeting-order-details-dialog/meeting-order-details-dialog.component';
import { InsighterFilterComponent } from './components/insighter-filter/insighter-filter.component';
import { TranslationModule } from 'src/app/modules/i18n';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule } from 'primeng/paginator';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { InsighterDashboardSharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [
    MyOrdersComponent,
    KnowledgeOrdersComponent,
    MeetingOrdersComponent,
    OrderDetailsDialogComponent,
    MeetingOrderDetailsDialogComponent,
    InsighterFilterComponent
  ],
  imports: [
    CommonModule,
    MyOrdersRoutingModule,
    TranslationModule,
    ProgressSpinnerModule,
    DialogModule,
    PaginatorModule,
    ButtonModule,
    TooltipModule,
    DropdownModule,
    InsighterDashboardSharedModule
  ]
})
export class MyOrdersModule { }
