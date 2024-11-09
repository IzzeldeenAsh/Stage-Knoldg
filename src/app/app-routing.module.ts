import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { adminGuard } from './guards/admin-guard/admin.guard';

export const routes: Routes = [
{
  path: '',
  redirectTo : 'auth',
  pathMatch:"full"
},
{
  path: 'auth',
  loadChildren: () =>
    import('./modules/auth/auth.module').then((m) => m.AuthModule),
},
{
  path: 'callback',
  loadChildren: () =>
    import('./modules/callback/callback.module').then((m) => m.CallbackModule),
},
// {
//   path: 'app',
//   loadChildren: () =>
//     import('./_metronic/layout/layout.module').then((m) => m.LayoutModule),
// },
{
  path: 'admin-dashboard',
  loadChildren: () =>
    import('./modules/admin-dashboard/admin-dashboard.module').then((m) => m.AdminDashboardModule),
    canActivate: [adminGuard]
},
{
  path: 'error',
  loadChildren: () =>
    import('./modules/errors/errors.module').then((m) => m.ErrorsModule),
},
{ path: '**', redirectTo: 'error/404' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

