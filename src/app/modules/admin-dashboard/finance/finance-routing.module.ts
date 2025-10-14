import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainFinanceComponent } from './main-finance/main-finance.component';
import { FeesControlComponent } from './main-finance/fees-control/fees-control.component';
import { AdminSalesComponent } from './admin-sales/admin-sales.component';


const routes: Routes = [
  {
    path:'',
    redirectTo:'sales',
    pathMatch:'full'
  },
  {
    path:'sales',
    component:AdminSalesComponent
  },
  {
    path:'main-settings',
    component:MainFinanceComponent,
    children:[
      {
        path:'',
        redirectTo:'fees-control',
        pathMatch:'full'
      },
      {
      path:'fees-control',
      component:FeesControlComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FinanceRoutingModule { }
