import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { MessageService } from 'primeng/api';
import { SocialsComponent } from './socials/socials.component';
import { WebsiteSettingsRoutingModule } from './website-settings-routing.module';

@NgModule({
  declarations: [
    SocialsComponent
  ],
  imports: [
    CommonModule,
    WebsiteSettingsRoutingModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    ToastModule,
    FormsModule,
    ReactiveFormsModule,
    CardModule
  ],
  providers: [MessageService]
})
export class WebsiteSettingsModule { } 