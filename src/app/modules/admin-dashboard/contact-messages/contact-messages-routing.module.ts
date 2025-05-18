import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ContactListComponent } from './contact-list/contact-list.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'contact-list',
    pathMatch: 'full'
  },
  {
    path: 'contact-list',
    component: ContactListComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ContactMessagesRoutingModule { }
