import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InsighterWalletsRoutingModule } from './insighter-wallets-routing.module';
import { InsighterWalletsListComponent } from './insighter-wallets-list/insighter-wallets-list.component';
import { InsighterTransactionsComponent } from './insighter-transactions/insighter-transactions.component';

@NgModule({
  declarations: [
    InsighterWalletsListComponent,
    InsighterTransactionsComponent
  ],
  imports: [
    CommonModule,
    InsighterWalletsRoutingModule
  ]
})
export class InsighterWalletsModule { }