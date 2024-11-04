import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CompanySettingsComponent } from './company-settings/company-settings.component';
import { DepartmentComponent } from './dashboard/departments/departments.component';
import { PositionsComponent } from './dashboard/positions/positions.component';
import { CountriesComponent } from './dashboard/countries/countries.component';
import { RegionsComponent } from './dashboard/regions/regions.component';
import { ConsultingFieldsComponent } from './dashboard/consulting-fields/consulting-fields.component';
import { ISICCodeManagmentComponent } from './dashboard/isic-code-managment/isic-code-managment.component';
import { TagsComponent } from './dashboard/tags/tags.component';
import { HSCodeComponent } from './hscode/hscode.component';


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
        redirectTo:'departments',
        pathMatch:'full'
      },
      {
        path:'departments',
        component:DepartmentComponent
      },
      {
        path:'positions',
        component:PositionsComponent
      },
      {
        path:'countries',
        component:CountriesComponent
      },
      {
        path:'regions',
        component:RegionsComponent
      },
      {
        path:'consulting-fields',
        component:ConsultingFieldsComponent
      },
      {
        path:'co-settings',
        component:CompanySettingsComponent
      },
      {
        path:'ISIC-code',
        component:ISICCodeManagmentComponent
      },
      {
        path:'tags',
        component:TagsComponent,
      }
      ,
      {
        path:'hscode',
        component:HSCodeComponent,
      }
    ]
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashbordRoutingModule { }
