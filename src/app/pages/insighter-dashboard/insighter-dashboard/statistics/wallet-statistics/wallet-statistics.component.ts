import { Component, OnInit, Injector } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-wallet-statistics',
  templateUrl: './wallet-statistics.component.html',
  styleUrls: ['./wallet-statistics.component.scss']
})
export class WalletStatisticsComponent extends BaseComponent implements OnInit {

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit(): void {
  }
}