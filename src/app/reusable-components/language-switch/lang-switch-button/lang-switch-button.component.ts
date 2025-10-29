import { Component, OnInit, Input } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { FontService } from 'src/app/_fake/services/font-change/font.service';
import { TranslationService } from 'src/app/modules/i18n/translation.service';

@Component({
  selector: 'app-lang-switch-button',
  templateUrl: './lang-switch-button.component.html',
  styleUrls: ['./lang-switch-button.component.scss']
})
export class LangSwitchButtonComponent implements OnInit {
  selectedLang = 'en'; // Default language
  @Input() isInsighterDashboard = false; // Flag to check if we're in insighter-dashboard routes
  isAuthPage = false; // Flag to check if we're in auth routes
  isMobileView = false; // Flag to check if we're in mobile view
  
  constructor(
    private translationService: TranslationService,
    private fontService: FontService, // Inject the FontService
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get the selected language from the translation service
    this.selectedLang = this.translationService.getSelectedLanguage();
    
    // Update font based on the language
    this.fontService.updateFont(this.selectedLang);

    // Check if we're in mobile view (< 992px according to Bootstrap)
    this.checkMobileView();
    window.addEventListener('resize', () => this.checkMobileView());

    // Check if we're in insighter-dashboard routes
    this.checkInsighterDashboardRoute(this.router.url);
    
    // Check if we're in auth routes
    this.checkAuthRoute(this.router.url);

    // Subscribe to router events to update the flag when the route changes
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd)
    ).subscribe((event) => {
      this.checkInsighterDashboardRoute(event.urlAfterRedirects);
      this.checkAuthRoute(event.urlAfterRedirects);
    });
  }

  switchLanguage(): void {
    // Toggle between English and Arabic
    const newLang = this.selectedLang === 'en' ? 'ar' : 'en';
    
    // Change the language in the app
    this.selectedLang = newLang;
    this.translationService.setLanguage(newLang);
    
    // Update font based on the new language
    this.fontService.updateFont(this.selectedLang);

    // Set the language preference in a cookie that works across subdomains
    // This matches the cookie set in the NextJS app
    const isProduction = location.hostname.includes('knoldg.com');
    const cookieParts = [
      `preferred_language=${newLang}`,
      `Path=/`,                       // send on all paths
      `Max-Age=${60 * 60 * 24 * 365}`,// one year
      `SameSite=Lax`                  // prevent CSRF, still send on top-level nav
    ];
    
    if (isProduction) {
      cookieParts.push(`Domain=.foresighta.co`); // leading dot = include subdomains
      cookieParts.push(`Secure`);                // HTTPS only in production
    }
    
    document.cookie = cookieParts.join('; ');

    // Reload the page to apply language changes
    window.location.reload();
  }

  // Helper method to check if we're in insighter-dashboard routes
  private checkInsighterDashboardRoute(url: string): void {
    this.isInsighterDashboard = this.isInsighterDashboard || url.includes('insighter-dashboard');
  }

  // Helper method to check if we're in auth routes
  private checkAuthRoute(url: string): void {
    this.isAuthPage = url.includes('/auth/sign-up');
  }

  // Helper method to check if we're in mobile view
  private checkMobileView(): void {
    this.isMobileView = window.innerWidth < 992;
  }
}