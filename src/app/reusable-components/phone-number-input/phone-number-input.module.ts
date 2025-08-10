import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { PhoneNumberInputComponent } from './phone-number-input.component';

@NgModule({
  declarations: [
    PhoneNumberInputComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DropdownModule,
    NgxMaskDirective
  ],
  providers: [
    provideNgxMask()
  ],
  exports: [
    PhoneNumberInputComponent
  ]
})
export class PhoneNumberInputModule { }