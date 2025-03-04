import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MyCompanyRoutingModule } from './my-company-routing.module';
import { MyCompanyComponent } from './my-company/my-company.component';
import { TranslationModule } from 'src/app/modules/i18n';

// PrimeNG Modules
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { AvatarModule } from 'primeng/avatar';
import { Paginator, PaginatorModule } from 'primeng/paginator';

@NgModule({
  declarations: [
    MyCompanyComponent
  ],

  imports: [
    CommonModule,
    MyCompanyRoutingModule,
    TranslationModule,
    FormsModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    PaginatorModule,
    ButtonModule,
    ToastModule,
    AvatarModule
  ]
})
export class MyCompanyModule { }
