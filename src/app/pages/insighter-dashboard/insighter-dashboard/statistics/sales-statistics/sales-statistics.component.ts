import { Component, OnInit, Injector } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';
import { BreadcrumbItem } from 'src/app/reusable-components/dashboard-statistics/dashboard-statistics.component';

@Component({
  selector: 'app-sales-statistics',
  templateUrl: './sales-statistics.component.html',
  styleUrls: ['./sales-statistics.component.scss']
})
export class SalesStatisticsComponent extends BaseComponent implements OnInit {
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', translationKey: 'DASHBOARD' },
    { label: 'Sales', translationKey: 'SALES.PAGE_TITLE' }
  ];

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit(): void {
  }
}