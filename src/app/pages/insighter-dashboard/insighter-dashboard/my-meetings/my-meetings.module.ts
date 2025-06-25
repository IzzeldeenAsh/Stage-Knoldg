import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { TranslationModule } from 'src/app/modules/i18n';
import { MyMeetingsComponent } from './my-meetings.component';
import { SentMeetingsComponent } from './sent-meetings/sent-meetings.component';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { TruncateTextPipe } from 'src/app/pipes/truncate-pipe/truncate-text.pipe';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'received',
    pathMatch: 'full'
  },
  {
    path: 'received',
    component: MyMeetingsComponent
  },
  {
    path: 'sent',
    component: SentMeetingsComponent
  }
];

@NgModule({
  declarations: [
    MyMeetingsComponent,
    SentMeetingsComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    TooltipModule,
    TruncateTextPipe,
    RouterModule.forChild(routes),
    TranslationModule,
  ]
})
export class MyMeetingsModule { } 