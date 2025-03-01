import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { IKnoldgProfile } from 'src/app/_fake/models/profile.interface';
import { TranslationService } from 'src/app/modules/i18n';

@Component({
  selector: 'app-navigation-tabs',
  templateUrl: './navigation-tabs.component.html',
  styleUrls: ['./navigation-tabs.component.scss']
})
export class NavigationTabsComponent implements OnInit, OnChanges {
  @Input() profile: IKnoldgProfile;
  lang: string = 'en';
  roles: string[] = [];
  filteredTabs:any;
  tabs = [
    { labelen: 'Overview', labelar: 'ملخص', link: '/app/profile/overview', activeInfo: true, activePrimary: false, roles: ['client', 'insighter', 'company'] },
    { labelen: 'Certificates', labelar: 'شهاداتي', link: '/app/profile/certificates', activeInfo: false, activePrimary: true, roles: ['insighter', 'company'] },
    { labelen: 'Documents', labelar: 'وثائقي', link: '/app/profile/documents', activeInfo: false, activePrimary: true, roles: ['company'] },
    { labelen: 'Settings', labelar: 'الإعدادات', link: '/app/profile/settings', activeInfo: false, activePrimary: true, roles: ['client', 'insighter', 'company'] },
  ];

  constructor(private translationService: TranslationService) {}

  ngOnInit(): void {
    this.roles = this.profile.roles;
    this.handleLanguage();
    this.filterTabs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.profile) {
      this.roles = this.profile.roles;
      this.filterTabs();
    }
  }

  handleLanguage() {
    this.lang = this.translationService.getSelectedLanguage();
    this.translationService.onLanguageChange().subscribe((lang) => {
      this.lang = lang;
    });
  }

  filterTabs() {
    this.filteredTabs = this.tabs.filter(tab => this.hasRole(tab.roles));
  }

  // Roles
  hasRole(requiredRoles: string[]): boolean {
    return requiredRoles.some(role => this.roles.includes(role));
  }

  ngOnDestroy(): void {
    // Unsubscribe logic if any
  }
}
