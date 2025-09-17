import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { TranslationModule } from 'src/app/modules/i18n';
import { SentMeetingsComponent } from './sent-meetings/sent-meetings.component';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { TruncateTextPipe } from 'src/app/pipes/truncate-pipe/truncate-text.pipe';
import { RolesGuard } from 'src/app/guards/roles-guard/roles-gurad.gurad';
import { authGuard } from 'src/app/guards/auth-guard/auth.guard';
import { MyMeetingsComponent } from './my-meetings.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'received',
    pathMatch: 'full'
  },
  {
    path: 'received',
    component: MyMeetingsComponent,
    canActivate:[authGuard,RolesGuard],
    data: { roles: [ 'insighter','company','company-insighter'] }
  },
  {
    path: 'sent',
    component: SentMeetingsComponent,
    canActivate:[authGuard,RolesGuard],
    data: { roles: [ 'insighter','company','company-insighter','client'] }
  }
];

@NgModule({
  declarations: [
    SentMeetingsComponent
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