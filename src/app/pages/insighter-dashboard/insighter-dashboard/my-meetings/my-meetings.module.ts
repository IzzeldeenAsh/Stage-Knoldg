import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { RolesGuard } from 'src/app/guards/roles-guard/roles-gurad.gurad';
import { authGuard } from 'src/app/guards/auth-guard/auth.guard';
import { MyMeetingsTabsComponent } from './my-meetings-tabs.component';

const routes: Routes = [
  {
    path: '',
    component: MyMeetingsTabsComponent,
    children: [
      {
        path: '',
        redirectTo: 'received',
        pathMatch: 'full'
      },
      {
        path: 'received',
        loadChildren: () => import('./received-meetings/received-meetings.module').then(m => m.ReceivedMeetingsModule),
        canActivate:[authGuard,RolesGuard],
        data: { roles: [ 'insighter','company','company-insighter'] }
      },
      {
        path: 'sent',
        loadChildren: () => import('./sent-meetings-tab/sent-meetings-tab.module').then(m => m.SentMeetingsTabModule),
        canActivate:[authGuard,RolesGuard],
        data: { roles: [ 'insighter','company','company-insighter','client'] }
      }
    ]
  }
];

@NgModule({
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class MyMeetingsModule { } 