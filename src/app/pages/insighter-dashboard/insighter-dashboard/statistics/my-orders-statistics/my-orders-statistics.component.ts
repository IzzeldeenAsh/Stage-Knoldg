import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-my-orders-statistics',
  templateUrl: './my-orders-statistics.component.html',
  styleUrls: ['./my-orders-statistics.component.scss']
})
export class MyOrdersStatisticsComponent extends BaseComponent implements OnInit {

  constructor(
    injector: Injector,
  ) {
    super(injector);
  }

  ngOnInit(): void {
  }
}