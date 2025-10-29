import { Component, HostBinding, Injector, OnInit, AfterViewInit, ElementRef, Renderer2, Output, EventEmitter } from '@angular/core';
import { Observable, Subscription, first } from 'rxjs';
import { TranslationService } from '../../../../../../modules/i18n';
import { AuthService, UserType } from '../../../../../../modules/auth';
import { IKnoldgProfile } from 'src/app/_fake/models/profile.interface';
import { Router } from '@angular/router';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { BaseComponent } from 'src/app/modules/base.component';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-user-inner',
  templateUrl: './user-inner.component.html',
  styles: [`
    .menu-sub-dropdown {
      position: absolute;
      top: 0;
      background-color: #ffffff;
      box-shadow: 0 0 50px 0 rgba(82, 63, 105, 0.15);
      border-radius: 0.475rem;
      z-index: 1200;
    }
    
    .menu-sub-dropdown.ltr {
      transform: translateX(-100%);
      left: 0;
    }
    
    .menu-sub-dropdown.rtl {
      transform: translateX(100%);
      right: 0;
      left: auto;
    }
    
    .menu-item {
      position: relative;
    }
    
    .menu-link {
      display: flex;
      align-items: center;
      padding: 0.65rem 1rem;
      color: #181C32;
      transition: color 0.2s ease;
    }
    
    .menu-link:hover {
      color: #0978B9;
      background-color: #F4F6FA;
    }
    
    .menu-arrow {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      margin-left: auto;
    }
    
    .menu-arrow:after {
      content: "";
      width: 6px;
      height: 6px;
      border-top: 1px solid;
      border-right: 1px solid;
    }
    
    :host-context([dir="rtl"]) {
      .menu-arrow:after {
      }
      
      .menu-arrow {
        margin-left: 0;
        margin-right: auto;
      }
    }
  `]
})
export class UserInnerComponent extends BaseComponent implements OnInit, AfterViewInit {
  @HostBinding('attr.data-kt-menu') dataKtMenu = 'true';
  @Output() closeDropdown = new EventEmitter<void>();

  language: LanguageFlag;
  user$: Observable<IKnoldgProfile>;
  langs = languages;
  isRTL: boolean = false;
  
  // Track submenu states
  submenuStates: { [key: string]: boolean } = {
    'insighterDashboard': false,
    'accountSettings': false,
    'language': false
  };

  constructor(
    private auth: AuthService,
    private translationService: TranslationService,
    private getProfileService: ProfileService,
    private elementRef: ElementRef,
    private renderer: Renderer2,
    injector: Injector
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.user$ = this.getProfileService.getProfile().pipe(first());
    this.setLanguage(this.translationService.getSelectedLanguage());
    this.isRTL = this.translationService.getSelectedLanguage() === 'ar';
    this.getProfileService.profileUpdate$.subscribe(() => {
      // Handle profile update here
      // For example, refresh your component's data
      this.refreshComponentData();
    });
  }
  
  ngAfterViewInit(): void {
    // Initialize submenu functionality
    this.initializeSubmenus();
  }
  
  initializeSubmenus(): void {
    // Find all submenu triggers
    const submenuTriggers = this.elementRef.nativeElement.querySelectorAll('[data-kt-menu-trigger]');
    
    // Add click event listeners to each trigger
    submenuTriggers.forEach((trigger: HTMLElement) => {
      this.renderer.listen(trigger, 'click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        
        // Find the submenu associated with this trigger
        const submenuId = trigger.getAttribute('data-submenu-id') || '';
        if (submenuId) {
          this.toggleSubmenu(submenuId);
        }
      });
    });
    
    // Add click listener to document to close submenus when clicking outside
    this.renderer.listen('document', 'click', (event: Event) => {
      const target = event.target as HTMLElement;
      const isInsideSubmenu = target.closest('.menu-sub-dropdown');
      const isSubmenuTrigger = target.closest('[data-kt-menu-trigger]');
      
      if (!isInsideSubmenu && !isSubmenuTrigger) {
        // Close all submenus
        Object.keys(this.submenuStates).forEach(key => {
          this.submenuStates[key] = false;
        });
      }
    });
  }
  
  toggleSubmenu(submenuId: string): void {
    // Close all other submenus
    Object.keys(this.submenuStates).forEach(key => {
      this.submenuStates[key] = key === submenuId ? !this.submenuStates[key] : false;
    });
  }

  refreshComponentData(){
    this.user$ = this.getProfileService.getProfile().pipe(first())
  }

  logout() {
    // Calculate timestamp to prevent caching
    const timestamp = new Date().getTime();
    
    // Create the redirect URI to the main domain
    const redirectUri = encodeURIComponent(`${environment.mainAppUrl}/en?logged_out=true&t=${timestamp}`);
    
    // Navigate to the logout route with the redirect URI
    window.location.href = `/auth/logout?redirect_uri=${redirectUri}`;
  }

  selectLanguage(lang: string) {
    this.translationService.setLanguage(lang);
    this.setLanguage(lang);
    window.location.reload();
  }

  setLanguage(lang: string) {
    this.isRTL = lang === 'ar';
    this.langs.forEach((language: LanguageFlag) => {
      if (language.lang === lang) {
        language.active = true;
        this.language = language;
      } else {
        language.active = false;
      }
    });
  }
}

interface LanguageFlag {
  lang: string;
  name: string;
  flag: string;
  active?: boolean;
}

const languages = [
  {
    lang: 'en',
    name: 'English',
    flag: './assets/media/flags/united-states.svg',
  },
  {
    lang: 'ar',
    name: 'Arabic',
    flag: './assets/media/flags/saudi-arabia.svg',
  },
];
