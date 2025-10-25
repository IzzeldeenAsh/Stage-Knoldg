import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { TranslationModule } from 'src/app/modules/i18n';
import { RolesGuard } from 'src/app/guards/roles-guard/roles-gurad.gurad';
import { authGuard } from 'src/app/guards/auth-guard/auth.guard';
import { MyMeetingsComponent } from './my-meetings.component';

const routes: Routes = [
  {
    path: '',
    component: MyMeetingsComponent,
    canActivate:[authGuard, RolesGuard],
    data: { roles: ['insighter', 'company', 'company-insighter', 'client'] }
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TranslationModule,
  ]
})
export class MyMeetingsModule { } 