import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ContactMessagesRoutingModule } from './contact-messages-routing.module';
import { ContactListComponent } from './contact-list/contact-list.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    ContactMessagesRoutingModule,
    HttpClientModule,
    ContactListComponent,
    SharedModule
  ]
})
export class ContactMessagesModule { }
