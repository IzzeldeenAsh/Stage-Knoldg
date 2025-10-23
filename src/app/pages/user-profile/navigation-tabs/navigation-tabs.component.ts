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
  category: 'personal' | 'company' | 'settings';  // Added category property
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
  personalTabs: NavigationTab[] = [];  // For personal category tabs
  companyTabs: NavigationTab[] = [];   // For company category tabs
  settingsTabs: NavigationTab[] = [];  // For settings category tabs
  menuItems: MenuItem[] = [];
  isSocialLogin: boolean = false;
  
  tabs: NavigationTab[] = [
    { labelen: 'My Information', labelar: 'معلوماتي', link: '/app/profile/overview', activeInfo: true, activePrimary: false, roles: ['client', 'insighter', 'company', 'company-insighter'], icon: 'user', category: 'personal' },
    { labelen: 'My Certificates', labelar: 'شهاداتي', link: '/app/profile/certificates', activeInfo: false, activePrimary: true, roles: ['insighter', 'company', 'company-insighter'], icon: 'certificate', category: 'personal' },
    { labelen: 'General Information', labelar: 'معلومات عامة', link: '/app/profile/company', activeInfo: false, activePrimary: true, roles: ['company'], icon: 'building', category: 'company' },
    { labelen: 'Certificates and Credentials', labelar: 'الشهادات والاعتمادات', link: '/app/profile/company-certificates', activeInfo: false, activePrimary: true, roles: ['company'], icon: 'award', category: 'company' },
    { labelen: 'Legal Documents', labelar: 'وثائق قانونية', link: '/app/profile/documents', activeInfo: false, activePrimary: true, roles: ['company'], icon: 'file-text', category: 'company' },
    // Settings tabs moved from settings-sidebar
    { labelen: 'Personal Settings', labelar: 'الإعدادات الشخصية', link: '/app/profile/settings/personal-info', activeInfo: false, activePrimary: true, roles: ['company', 'insighter', 'client'], icon: 'id-card', category: 'settings' },
    { labelen: 'Company Settings', labelar: 'إعدادات الشركة', link: '/app/profile/settings/company-settings', activeInfo: false, activePrimary: true, roles: ['company'], icon: 'cog', category: 'settings' },
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
          labelen: 'Change Password',
          labelar: 'تغيير كلمة المرور',
          link: '/app/profile/settings/reset-password',
          activeInfo: false,
          activePrimary: true,
          roles: ['client'],
          icon: 'lock',
          category: 'settings'  // Add category property
        });
      }
    }
  }

  filterTabs() {
    this.filteredTabs = this.tabs.filter(tab => this.hasRole(tab.roles));
    
    // Categorize tabs into their respective groups
    this.personalTabs = this.filteredTabs.filter(tab => tab.category === 'personal');
    this.companyTabs = this.filteredTabs.filter(tab => tab.category === 'company');
    this.settingsTabs = this.filteredTabs.filter(tab => tab.category === 'settings');
  }

  buildMenu() {
    this.menuItems = this.filteredTabs.map((tab: NavigationTab) => ({
      label: this.lang === 'en' ? tab.labelen : tab.labelar,
      icon: this.getDuotuneIconPath(tab.icon),
      routerLink: tab.link
    }));
  }

  // Map icon names to PrimeNG icons
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
  
  // Map icon names to duotune SVG paths (keeping for future reference)
  getDuotuneIconPath(icon: string): string {
    const iconMap: {[key: string]: string} = {
      'user': 'duotune/general/gen049.svg',
      'certificate': 'duotune/general/gen026.svg',
      'building': 'duotune/general/gen055.svg',
      'award': 'duotune/general/gen047.svg',
      'file-text': 'duotune/files/fil003.svg',
      'id-card': 'duotune/general/gen046.svg',
      'lock': 'duotune/general/gen048.svg',
      'cog': 'duotune/general/gen054.svg'
    };
    return iconMap[icon] || 'duotune/general/gen051.svg';
  }

  // Roles
  hasRole(requiredRoles: string[]): boolean {
    return requiredRoles.some(role => this.roles.includes(role));
  }

  ngOnDestroy(): void {
    // Unsubscribe logic if any
  }
}
