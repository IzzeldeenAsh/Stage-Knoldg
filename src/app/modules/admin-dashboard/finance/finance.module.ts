import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FinanceRoutingModule } from './finance-routing.module';
import { MainFinanceComponent } from './main-finance/main-finance.component';
import { FeesControlComponent } from './main-finance/fees-control/fees-control.component';
import { CasePublishFeesComponent } from './main-finance/fees-control/case-publish-fees/case-publish-fees.component';
import { PrizePublisFeesComponent } from './main-finance/fees-control/prize-publis-fees/prize-publis-fees.component';
import { AdminSalesComponent } from './admin-sales/admin-sales.component';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { ChartModule } from 'primeng/chart';


@NgModule({
  declarations: [
    MainFinanceComponent,
    FeesControlComponent,
    CasePublishFeesComponent,
    PrizePublisFeesComponent,
    AdminSalesComponent
  ],
  imports: [
    CommonModule,
    FinanceRoutingModule,
    InlineSVGModule,
    ChartModule
  ]
})
export class FinanceModule { }
