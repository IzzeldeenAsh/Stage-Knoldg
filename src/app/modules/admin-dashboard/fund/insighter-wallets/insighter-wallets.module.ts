import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InsighterWalletsRoutingModule } from './insighter-wallets-routing.module';
import { InsighterWalletsListComponent } from './insighter-wallets-list/insighter-wallets-list.component';
import { InsighterTransactionsComponent } from './insighter-transactions/insighter-transactions.component';
import { InsighterWalletFormComponent } from './insighter-wallet-form/insighter-wallet-form.component';

@NgModule({
  declarations: [
    InsighterWalletsListComponent,
    InsighterTransactionsComponent,
    InsighterWalletFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    InsighterWalletsRoutingModule
  ]
})
export class InsighterWalletsModule { }