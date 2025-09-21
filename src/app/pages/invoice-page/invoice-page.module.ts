import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InvoicePageComponent } from './invoice-page.component';
import { InvoiceViewerModule } from 'src/app/reusable-components/invoice-viewer/invoice-viewer.module';

@NgModule({
  declarations: [
    InvoicePageComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: InvoicePageComponent
      }
    ]),
    InvoiceViewerModule
  ]
})
export class InvoicePageModule { }