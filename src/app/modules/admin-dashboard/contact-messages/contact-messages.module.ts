import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ContactMessagesRoutingModule } from './contact-messages-routing.module';
import { ContactListComponent } from './contact-list/contact-list.component';

@NgModule({
  imports: [
    CommonModule,
    ContactMessagesRoutingModule,
    HttpClientModule,
    ContactListComponent
  ]
})
export class ContactMessagesModule { }
