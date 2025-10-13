import { Component, OnInit, Injector } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-sales-statistics',
  templateUrl: './sales-statistics.component.html',
  styleUrls: ['./sales-statistics.component.scss']
})
export class SalesStatisticsComponent extends BaseComponent implements OnInit {

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit(): void {
  }
}