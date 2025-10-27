import { Component, Injector } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';
import { BreadcrumbItem } from 'src/app/reusable-components/dashboard-statistics/dashboard-statistics.component';

@Component({
  selector: 'app-read-later-statistics',
  templateUrl: './read-later-statistics.component.html',
  styleUrls: ['./read-later-statistics.component.scss']
})
export class ReadLaterStatisticsComponent extends BaseComponent {
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Read Later', translationKey: 'INSIGHTER.DASHBOARD.NAV.READ_LATER' }
  ];

  constructor(injector: Injector) {
    super(injector);
  }
}