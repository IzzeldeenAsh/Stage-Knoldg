import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SentMeetingsTabComponent } from './sent-meetings-tab.component';

const routes: Routes = [
  {
    path: '',
    component: SentMeetingsTabComponent
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class SentMeetingsTabModule { }