import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { MessagsComponent } from './messags/messags.component';
import { ReportsComponent } from './reports/reports.component';
import { CompanySettingsComponent } from './company-settings/company-settings.component';
import { SummaryComponent } from './dashboard/summary/summary.component';

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
        redirectTo:'summary',
        pathMatch:'full'
      },
      {
        path:'summary',
        component:SummaryComponent
      },
      {

        path:'messages',
        component:MessagsComponent
      },
      {
        path:'reports',
        component:ReportsComponent
      }
      ,
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
