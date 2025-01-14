import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MyRequestsComponent } from './my-requests.component';
import { TranslationModule } from 'src/app/modules/i18n';
import { FormsModule } from '@angular/forms';
import {  DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';

const routes: Routes = [
  {
    path: '',
    component: MyRequestsComponent
  }
];

@NgModule({
  declarations: [
    MyRequestsComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TranslationModule,
    DialogModule,
    FormsModule,
    ProgressBarModule,
  ]
})
export class MyRequestsModule { } 