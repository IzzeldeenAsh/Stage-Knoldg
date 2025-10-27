import { Component, Injector } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';
import { BreadcrumbItem } from 'src/app/reusable-components/dashboard-statistics/dashboard-statistics.component';

@Component({
  selector: 'app-sent-meetings-statistics',
  templateUrl: './sent-meetings-statistics.component.html',
  styleUrls: ['./sent-meetings-statistics.component.scss']
})
export class SentMeetingsStatisticsComponent extends BaseComponent {
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'My Meetings', translationKey: 'INSIGHTER.DASHBOARD.NAV.MY_MEETINGS' }
  ];

  constructor(injector: Injector) {
    super(injector);
  }
} 