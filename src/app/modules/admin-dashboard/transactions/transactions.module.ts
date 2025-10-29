import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { TransactionsComponent } from './transactions.component';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ChipModule } from 'primeng/chip';
import { ToastModule } from 'primeng/toast';
import { ServiceNamePipe } from '../../../shared/pipes/service-name.pipe';
import { ChartModule } from 'primeng/chart';
import { PaginatorModule } from 'primeng/paginator';

const routes: Routes = [
  {
    path: '',
    component: TransactionsComponent
  }
];

@NgModule({
  declarations: [
    TransactionsComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TableModule,
    ButtonModule,
    TagModule,
    ChartModule,
    DialogModule,
    PaginatorModule,
    TooltipModule,
    ChipModule,
    ToastModule,
    ServiceNamePipe
  ]
})
export class TransactionsModule { }