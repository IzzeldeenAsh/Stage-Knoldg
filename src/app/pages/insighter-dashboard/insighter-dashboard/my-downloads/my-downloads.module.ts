import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MyDownloadsComponent } from './my-downloads.component';
import { TranslationModule } from 'src/app/modules/i18n';

const routes: Routes = [
  {
    path: '',
    component: MyDownloadsComponent
  }
];

@NgModule({
  declarations: [
    MyDownloadsComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TranslationModule,
  ]
})
export class MyDownloadsModule { } 