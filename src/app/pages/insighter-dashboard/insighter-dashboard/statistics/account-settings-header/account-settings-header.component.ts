import { Component, Injector } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';
import { BreadcrumbItem } from 'src/app/reusable-components/dashboard-statistics/dashboard-statistics.component';

@Component({
  selector: 'app-account-settings-header',
  templateUrl: './account-settings-header.component.html',
  styleUrl: './account-settings-header.component.scss'
})
export class AccountSettingsHeaderComponent extends BaseComponent {
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', translationKey: 'DASHBOARD' },
    { label: 'Account Settings', translationKey: 'INSIGHTER.DASHBOARD.NAV.ACCOUNT_SETTINGS' }
  ];

  constructor(injector: Injector) {
    super(injector);
  }
}
