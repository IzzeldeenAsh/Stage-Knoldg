import { Component, Injector } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';
import { BreadcrumbItem } from 'src/app/reusable-components/dashboard-statistics/dashboard-statistics.component';

@Component({
  selector: 'app-meetings-statistics',
  templateUrl: './meetings-statistics.component.html',
  styleUrls: ['./meetings-statistics.component.scss']
})
export class MeetingsStatisticsComponent extends BaseComponent {
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', translationKey: 'DASHBOARD' },
    { label: 'My Meetings', translationKey: 'INSIGHTER.DASHBOARD.NAV.MY_MEETINGS' }
  ];

  constructor(injector: Injector) {
    super(injector);
  }
} 