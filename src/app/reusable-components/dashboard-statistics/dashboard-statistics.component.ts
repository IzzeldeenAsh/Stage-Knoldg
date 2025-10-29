import { Component, Input, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { BaseComponent } from 'src/app/modules/base.component';
import { CountUpDirective } from 'src/app/directives/countup/count-up.directive';

export interface BreadcrumbItem {
  label: string;
  translationKey?: string;
  route?: string;
}

export interface StatisticCard {
  icon: string;
  iconType?: 'ki-solid' | 'ki-duotone' | 'ki-outline' | 'pi';
  iconColor: string;
  value: number | string;
  label: string;
  translationKey: string;
  useCountUp?: boolean;
}

@Component({
  selector: 'app-dashboard-statistics',
  standalone: true,
  imports: [CommonModule, TranslateModule, CountUpDirective],
  templateUrl: './dashboard-statistics.component.html',
  styleUrl: './dashboard-statistics.component.scss'
})
export class DashboardStatisticsComponent extends BaseComponent {
  @Input() breadcrumbs: BreadcrumbItem[] = [];
  @Input() statisticCards: StatisticCard[] = [];
  @Input() showStatistics: boolean = false;

  constructor(injector: Injector) {
    super(injector);
  }

  getNumericValue(value: number | string): number {
    return typeof value === 'number' ? value : 0;
  }
}
