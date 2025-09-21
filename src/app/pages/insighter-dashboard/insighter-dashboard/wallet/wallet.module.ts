import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { WalletComponent } from './wallet.component';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { PaginatorModule } from 'primeng/paginator';
import { TooltipModule } from 'primeng/tooltip';
import { BadgeModule } from 'primeng/badge';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ChartModule } from 'primeng/chart';

const routes: Routes = [
  {
    path: '',
    component: WalletComponent
  }
];

@NgModule({
  declarations: [
    WalletComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TableModule,
    TagModule,
    ButtonModule,
    DialogModule,
    CardModule,
    ProgressSpinnerModule,
    PaginatorModule,
    TooltipModule,
    BadgeModule,
    FormsModule,
    TranslateModule,
    ChartModule
  ]
})
export class WalletModule { }