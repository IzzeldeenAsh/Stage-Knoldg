import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { IKnoldgProfile } from 'src/app/_fake/models/profile.interface';
import { TranslationService } from 'src/app/modules/i18n';
import { MenuItem } from 'primeng/api';
import { AuthService } from 'src/app/modules/auth';

interface NavigationTab {
  labelen: string;
  labelar: string;
  link: string;
  activeInfo: boolean;
  activePrimary: boolean;
  roles: string[];
  icon: string;
}

@Component({
  selector: 'app-navigation-tabs',
  templateUrl: './navigation-tabs.component.html',
  styleUrls: ['./navigation-tabs.component.scss']
})
export class NavigationTabsComponent implements OnInit, OnChanges {
  @Input() profile: IKnoldgProfile;
  lang: string = 'en';
  roles: string[] = [];
  filteredTabs: NavigationTab[] = [];
  menuItems: MenuItem[] = [];
  isSocialLogin: boolean = false;
  
  tabs: NavigationTab[] = [
    { labelen: 'Personal Info', labelar: 'معلوماتي', link: '/app/profile/overview', activeInfo: true, activePrimary: false, roles: ['client', 'insighter', 'company', 'company-insighter'], icon: 'user' },
    { labelen: 'My Certificates', labelar: 'شهاداتي', link: '/app/profile/certificates', activeInfo: false, activePrimary: true, roles: ['insighter', 'company', 'company-insighter'], icon: 'certificate' },
    { labelen: 'My Company Info', labelar: 'معلومات شركتي', link: '/app/profile/company', activeInfo: false, activePrimary: true, roles: ['company'], icon: 'building' },
    { labelen: 'Company Certificates', labelar: 'شهادات الشركة', link: '/app/profile/company-certificates', activeInfo: false, activePrimary: true, roles: ['company'], icon: 'award' },
    { labelen: 'Documents', labelar: 'وثائقي', link: '/app/profile/documents', activeInfo: false, activePrimary: true, roles: ['company'], icon: 'file-text' },
    // Settings tabs moved from settings-sidebar
    { labelen: 'Personal Settings', labelar: 'البيانات الشخصية', link: '/app/profile/settings/personal-info', activeInfo: false, activePrimary: true, roles: ['company', 'insighter', 'client'], icon: 'id-card' },
    { labelen: 'Company Settings', labelar: 'بيانات الشركة', link: '/app/profile/settings/company-settings', activeInfo: false, activePrimary: true, roles: ['company'], icon: 'cog' },
  ];

  constructor(
    private translationService: TranslationService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.roles = this.profile.roles;
    this.handleLanguage();
    this.checkSocialLogin();
    this.filterTabs();
    this.buildMenu();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.profile) {
      this.roles = this.profile.roles;
      this.checkSocialLogin();
      this.filterTabs();
      this.buildMenu();
    }
  }

  handleLanguage() {
    this.lang = this.translationService.getSelectedLanguage();
    this.translationService.onLanguageChange().subscribe((lang) => {
      this.lang = lang;
      this.buildMenu();
    });
  }

  checkSocialLogin() {
    this.isSocialLogin = this.profile.login_social === true;
    
    // Add Reset Password tab for non-social login users
    if (!this.isSocialLogin) {
      // Check if it's already added to avoid duplicates
      const hasResetPassword = this.tabs.some(tab => tab.link === '/app/profile/settings/reset-password');
      if (!hasResetPassword) {
        this.tabs.push({
          labelen: 'Reset Password',
          labelar: 'تغيير كلمة المرور',
          link: '/app/profile/settings/reset-password',
          activeInfo: false,
          activePrimary: true,
          roles: ['client'],
          icon: 'lock'
        });
      }
    }
  }

  filterTabs() {
    this.filteredTabs = this.tabs.filter(tab => this.hasRole(tab.roles));
  }

  buildMenu() {
    this.menuItems = this.filteredTabs.map((tab: NavigationTab) => ({
      label: this.lang === 'en' ? tab.labelen : tab.labelar,
      icon: `pi pi-${this.getPrimeIcon(tab.icon)}`,
      routerLink: tab.link
    }));
  }

  // Map Metronic icons to PrimeNG icons
  getPrimeIcon(icon: string): string {
    const iconMap: {[key: string]: string} = {
      'user': 'user',
      'certificate': 'verified',
      'building': 'building',
      'award': 'star',
      'file-text': 'file',
      'id-card': 'id-card',
      'lock': 'lock',
      'cog': 'cog'
    };
    return iconMap[icon] || 'circle';
  }

  // Roles
  hasRole(requiredRoles: string[]): boolean {
    return requiredRoles.some(role => this.roles.includes(role));
  }

  ngOnDestroy(): void {
    // Unsubscribe logic if any
  }
}
