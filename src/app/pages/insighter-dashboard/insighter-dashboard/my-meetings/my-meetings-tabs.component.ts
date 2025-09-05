import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { TranslationModule } from 'src/app/modules/i18n';
import { filter } from 'rxjs';

@Component({
  selector: 'app-my-meetings-tabs',
  templateUrl: './my-meetings-tabs.component.html',
  styleUrls: ['./my-meetings-tabs.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, TranslationModule]
})
export class MyMeetingsTabsComponent {
  activeTab: string = 'received';
  
  constructor(private router: Router) {
    // Listen to route changes to update active tab
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        if (event instanceof NavigationEnd) {
          const urlSegments = event.url.split('/');
          const lastSegment = urlSegments[urlSegments.length - 1];
          if (lastSegment === 'received' || lastSegment === 'sent') {
            this.activeTab = lastSegment;
          }
        }
      });
  }
  
  navigateToTab(tab: string): void {
    this.router.navigate(['/app/insighter-dashboard/my-meetings', tab]);
  }
}