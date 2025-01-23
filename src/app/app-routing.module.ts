import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { adminGuard } from './guards/admin-guard/admin.guard';
import { authGuard } from './guards/auth-guard/auth.guard';
import { UnAuthGuard } from './guards/unauth-guard/un-auth.guard';

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
  path: 'app',
  loadChildren: () =>
    import('./_metronic/layout/layout.module').then((m) => m.LayoutModule),
},
{
  path: 'edit-knowledge',
  loadChildren: () =>
    import('./pages/add-knowledge/wizards.module').then((m) => m.WizardsModule),
},
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

{ path: '**', redirectTo: 'auth' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

