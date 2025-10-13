import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SalesComponent } from './sales.component';
import { TranslationModule } from 'src/app/modules/i18n';
import { ChartModule } from 'primeng/chart';

const routes: Routes = [
  {
    path: '',
    component: SalesComponent
  }
];

@NgModule({
  declarations: [
    SalesComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TranslationModule,
    ChartModule
  ]
})
export class SalesModule { }