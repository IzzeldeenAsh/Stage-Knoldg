import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard.component';

const routes: Routes = [ {
  path: '',
  redirectTo: 'admin',
  pathMatch: 'full',
},
{
  path: 'admin',
  component:AdminDashboardComponent,
  children: [
    {
      path: '',
      redirectTo: 'dashboard',
      pathMatch: 'full',
    },
    {
      path: 'dashboard',
      loadChildren: () =>
        import('./dashbord/dashbord.module').then(
          (m) => m.DashbordModule
        ),
    },

    {
      path: 'finance',
      loadChildren: () =>
        import('./finance/finance.module').then(
          (m) => m.FinanceModule
        ),
    },
    {
      path: 'users',
      loadChildren: () =>
        import('./users/users.module').then(
          (m) => m.UsersModule
        ),
    },
  ],
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminDashboardRoutingModule { }
