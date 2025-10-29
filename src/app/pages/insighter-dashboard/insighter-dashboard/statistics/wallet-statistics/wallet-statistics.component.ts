import { Component, OnInit, Injector } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';
import { BreadcrumbItem } from 'src/app/reusable-components/dashboard-statistics/dashboard-statistics.component';

@Component({
  selector: 'app-wallet-statistics',
  templateUrl: './wallet-statistics.component.html',
  styleUrls: ['./wallet-statistics.component.scss']
})
export class WalletStatisticsComponent extends BaseComponent implements OnInit {
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Wallet', translationKey: 'INSIGHTER.DASHBOARD.NAV.WALLET' }
  ];

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit(): void {
  }
}