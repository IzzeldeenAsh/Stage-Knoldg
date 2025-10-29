import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StaffSettingsComponent } from './staff-settings/staff-settings.component';
import { ChangePasswordComponent } from './staff-settings/change-password/change-password.component';

const routes: Routes = [
  {
    path:'',
    component:StaffSettingsComponent,
    children:[
      {
        path:'',
        redirectTo:'resetpassword',
        pathMatch:'full'
      },
      {
        path:'resetpassword',
        component:ChangePasswordComponent
      }
    ]
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class StaffSettingsRoutingModule { }
