import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyOrdersRoutingModule } from './my-orders-routing.module';
import { MyOrdersComponent } from './my-orders.component';
import { TranslationModule } from 'src/app/modules/i18n';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { DialogModule } from 'primeng/dialog';
import { PaginatorModule } from 'primeng/paginator';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';

@NgModule({
  declarations: [
    MyOrdersComponent
  ],
  imports: [
    CommonModule,
    MyOrdersRoutingModule,
    TranslationModule,
    ProgressSpinnerModule,
    DialogModule,
    PaginatorModule,
    ButtonModule,
    TooltipModule
  ]
})
export class MyOrdersModule { }