import { Component, Injector, OnInit, OnDestroy } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';
import { BreadcrumbItem, StatisticCard } from 'src/app/reusable-components/dashboard-statistics/dashboard-statistics.component';
import { OrderStatisticsService } from '../../my-orders/order-statistics.service';

@Component({
  selector: 'app-my-orders-statistics',
  templateUrl: './my-orders-statistics.component.html',
  styleUrls: ['./my-orders-statistics.component.scss']
})
export class MyOrdersStatisticsComponent extends BaseComponent implements OnInit, OnDestroy {
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', translationKey: 'DASHBOARD' },
    { label: 'My Orders', translationKey: 'INSIGHTER.DASHBOARD.NAV.MY_ORDERS' }
  ];

  statisticCards: StatisticCard[] = [];

  constructor(
    injector: Injector,
    private orderStatisticsService: OrderStatisticsService
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.loadStatistics();
  }

  private loadStatistics(): void {
    const sub = this.orderStatisticsService.getOrderStatistics().subscribe({
      next: (response) => {
        const stats = response.data;
        this.statisticCards = [
          {
            icon: 'ki-basket',
            iconType: 'ki-solid',
            iconColor: 'text-success',
            value: stats.orders_purchased_amount,
            label: 'Total Purchased',
            translationKey: this.lang === 'ar' ? 'إجمالي المشتريات' : 'Total Purchases',
            useCountUp: true
          },
          {
            icon: 'ki-dollar',
            iconType: 'ki-solid',
            iconColor: 'text-info',
            value: stats.orders_sold_amount,
            label: 'Total Sold',
            translationKey: this.lang === 'ar' ? 'إجمالي المبيعات' : 'Total Solds',
            useCountUp: true
          }
        ];
      },
      error: (error) => {
        console.error('Error loading order statistics:', error);
        this.showError(
          this.lang === 'ar' ? 'خطأ' : 'Error',
          this.lang === 'ar' ? 'فشل تحميل إحصائيات الطلبات' : 'Failed to load order statistics'
        );
      }
    });

    this.unsubscribe.push(sub);
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
  }
}