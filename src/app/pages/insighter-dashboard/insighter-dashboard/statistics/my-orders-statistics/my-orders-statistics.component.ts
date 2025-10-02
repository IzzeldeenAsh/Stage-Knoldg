import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';
import { OrderStatisticsService, OrderStatistics } from '../../my-orders/order-statistics.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-my-orders-statistics',
  templateUrl: './my-orders-statistics.component.html',
  styleUrls: ['./my-orders-statistics.component.scss']
})
export class MyOrdersStatisticsComponent extends BaseComponent implements OnInit {
  statistics$: Observable<OrderStatistics | null>;
  isLoading$: Observable<boolean>;

  constructor(
    injector: Injector,
    private orderStatisticsService: OrderStatisticsService
  ) {
    super(injector);
    this.statistics$ = this.orderStatisticsService.statistics$;
    this.isLoading$ = this.orderStatisticsService.isLoading$;
  }

  ngOnInit(): void {
    // Load statistics only if not already loaded
    if (!this.orderStatisticsService.getCurrentStatistics()) {
      this.orderStatisticsService.loadStatistics();
    }
  }
}