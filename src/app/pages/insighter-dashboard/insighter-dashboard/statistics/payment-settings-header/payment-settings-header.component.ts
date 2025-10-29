import { Component, Injector } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';
import { BreadcrumbItem } from 'src/app/reusable-components/dashboard-statistics/dashboard-statistics.component';

@Component({
  selector: 'app-payment-settings-header',
  templateUrl: './payment-settings-header.component.html',
  styleUrl: './payment-settings-header.component.scss'
})
export class PaymentSettingsHeaderComponent extends BaseComponent {
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Payment Settings', translationKey: 'INSIGHTER.DASHBOARD.NAV.PAYMENT_SETTINGS_HEADER' }
  ];

  constructor(injector: Injector) {
    super(injector);
  }
}