import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MyDashboardComponent } from './my-dashboard.component';
import { TranslationModule } from 'src/app/modules/i18n';

const routes: Routes = [
  {
    path: '',
    component: MyDashboardComponent
  }
];

@NgModule({
  declarations: [
    MyDashboardComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TranslationModule
  ]
})
export class MyDashboardModule { } 