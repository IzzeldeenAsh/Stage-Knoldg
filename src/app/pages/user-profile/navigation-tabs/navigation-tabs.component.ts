import { Component } from '@angular/core';

@Component({
  selector: 'app-navigation-tabs',
  templateUrl: './navigation-tabs.component.html',
  styleUrl: './navigation-tabs.component.scss'
})
export class NavigationTabsComponent {
  tabs = [
    { label: 'Overview', link: '/app/profile/overview', activeInfo: true, activePrimary: false },
    { label: 'Insights', link: '/crafted/pages/profile/insights', activeInfo: false, activePrimary: true },
    { label: 'Campaigns', link: '/crafted/pages/profile/campaigns', activeInfo: false, activePrimary: true },
    { label: 'Documents', link: '/crafted/pages/profile/documents', activeInfo: false, activePrimary: true },
    { label: 'Connections', link: '/crafted/pages/profile/connections', activeInfo: false, activePrimary: true },
  ];
}
