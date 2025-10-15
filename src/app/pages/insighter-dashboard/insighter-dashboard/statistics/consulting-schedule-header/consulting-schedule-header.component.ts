import { Component, Injector } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';
import { BreadcrumbItem } from 'src/app/reusable-components/dashboard-statistics/dashboard-statistics.component';

@Component({
  selector: 'app-consulting-schedule-header',
  templateUrl: './consulting-schedule-header.component.html',
  styleUrls: ['./consulting-schedule-header.component.scss']
})
export class ConsultingScheduleHeaderComponent extends BaseComponent {
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', translationKey: 'DASHBOARD' },
    { label: 'Meeting Settings', translationKey: 'INSIGHTER.DASHBOARD.NAV.MY_CONSULTING_SCHEDULE' }
  ];

  constructor(injector: Injector) {
    super(injector);
  }
} 