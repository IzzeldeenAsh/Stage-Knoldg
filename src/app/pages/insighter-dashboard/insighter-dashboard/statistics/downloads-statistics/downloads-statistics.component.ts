import { Component, Injector } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';
import { BreadcrumbItem } from 'src/app/reusable-components/dashboard-statistics/dashboard-statistics.component';

@Component({
  selector: 'app-downloads-statistics',
  templateUrl: './downloads-statistics.component.html',
  styleUrls: ['./downloads-statistics.component.scss']
})
export class DownloadsStatisticsComponent extends BaseComponent {
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'My Downloads', translationKey: 'INSIGHTER.DASHBOARD.NAV.MY_DOWNLOADS' }
  ];

  constructor(injector: Injector) {
    super(injector);
  }
} 