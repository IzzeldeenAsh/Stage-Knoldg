import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CompanySettingsComponent } from './company-settings/company-settings.component';
import { DepartmentComponent } from './dashboard/departments/departments.component';

const routes: Routes = [
  {
    path:'',
    redirectTo:'main-dashboard',
    pathMatch:'full'
  },
  {
    path:'main-dashboard',
    component:DashboardComponent,
    children:[
      {
        path:'',
        redirectTo:'Departments',
        pathMatch:'full'
      },
      {
        path:'Departments',
        component:DepartmentComponent
      },
      {
        path:'co-settings',
        component:CompanySettingsComponent
      }
    ]
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashbordRoutingModule { }
