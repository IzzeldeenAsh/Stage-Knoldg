import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceViewerComponent } from './invoice-viewer.component';

@NgModule({
  declarations: [
    InvoiceViewerComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    InvoiceViewerComponent
  ]
})
export class InvoiceViewerModule { }