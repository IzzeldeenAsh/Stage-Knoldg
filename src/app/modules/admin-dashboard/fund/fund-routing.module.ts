import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'insighter-wallets',
    pathMatch: 'full',
  },
  {
    path: 'insighter-wallets',
    loadChildren: () =>
      import('./insighter-wallets/insighter-wallets.module').then(
        (m) => m.InsighterWalletsModule
      ),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FundRoutingModule { }