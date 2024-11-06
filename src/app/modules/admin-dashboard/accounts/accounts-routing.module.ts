import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountsComponent } from './accounts.component';
import { StaffComponent } from './staff/staff.component';
import { RolesComponent } from './roles/roles.component';
import { PermissionsComponent } from './permissions/permissions.component';

const routes: Routes = [
  {
    path:'',
    redirectTo:'main-accounts',
    pathMatch:'full'
  },
  {
    path:'main-accounts',
    component:AccountsComponent,
    children:[
      {
        path:'',
        redirectTo:'staff',
        pathMatch:'full'
      },
      {
        path:'staff',
        component:StaffComponent
      },
      {
        path:'roles',
        component:RolesComponent
      },
      {
        path:'permissions',
        component:PermissionsComponent
      }
      
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AccountsRoutingModule { }
