import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InsighterWalletsListComponent } from './insighter-wallets-list/insighter-wallets-list.component';
import { InsighterTransactionsComponent } from './insighter-transactions/insighter-transactions.component';
import { InsighterWalletFormComponent } from './insighter-wallet-form/insighter-wallet-form.component';

const routes: Routes = [
  {
    path: '',
    component: InsighterWalletsListComponent,
  },
  {
    path: 'form/:id',
    component: InsighterWalletFormComponent,
  },
  {
    path: 'transactions/:id',
    component: InsighterTransactionsComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InsighterWalletsRoutingModule { }