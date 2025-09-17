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
      path: 'accounts',
      loadChildren: () =>
        import('./accounts/accounts.module').then(
          (m) => m.AccountsModule
        ),
    },
    {
      path: 'my-settings',
      loadChildren: () =>
        import('./staff-settings/staff-settings.module').then(
          (m) => m.StaffSettingsModule
        ),
    },
    {
      path: 'website-settings',
      loadChildren: () =>
        import('./website-settings/website-settings.module').then(
          (m) => m.WebsiteSettingsModule
        ),
    },
    {
      path: 'contact-messages',
      loadChildren: () =>
        import('./contact-messages/contact-messages.module').then(
          (m) => m.ContactMessagesModule
        ),
    },
    {
      path: 'orders',
      loadChildren: () =>
        import('./orders/orders.module').then(
          (m) => m.OrdersModule
        ),
    },
    {
      path: 'transactions',
      loadChildren: () =>
        import('./transactions/transactions.module').then(
          (m) => m.TransactionsModule
        ),
    },
    {
      path: 'fund',
      loadChildren: () =>
        import('./fund/fund.module').then(
          (m) => m.FundModule
        ),
    },
    { path: '**', redirectTo: 'auth' },
  ],
  
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminDashboardRoutingModule { }
