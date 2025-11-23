import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { first } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';
import { TranslationService } from 'src/app/modules/i18n';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss'],
})
export class LogoutComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private translationService: TranslationService
  ) {}

  ngOnInit(): void {
    this.processLogout();
  }

  private processLogout(): void {
    // Check if we have a redirect URL from query parameters
    this.route.queryParams.subscribe(params => {
      const redirectUri = params['redirect_uri'];
      
      console.log('Processing logout with redirect URI:', redirectUri);
      
      // Clear ALL auth data using the auth service
      this.authService.handleLogout().pipe(first()).subscribe({
        next: () => {
          console.log('Logout successful');
          this.handleRedirect(redirectUri);
        },
        error: (error) => {
          console.error('Logout error:', error);
          // Continue with redirect even if logout fails
          this.handleRedirect(redirectUri);
        }
      });
    });
  }

  private handleRedirect(redirectUri?: string): void {
    // If we have a redirect URI, use it
    if (redirectUri) {
      console.log('Redirecting to specified URI:', redirectUri);
      window.location.href = redirectUri;
      return;
    }
    
    // Otherwise, redirect to main domain with logout confirmation
    this.redirectToMainDomain();
  }

  private redirectToMainDomain(): void {
    const timestamp = new Date().getTime();
    const lang = this.translationService.getSelectedLanguage();
    const redirectUrl = `${environment.mainAppUrl}/${lang}?logged_out=true&t=${timestamp}`;
    
    console.log('Redirecting to main domain:', redirectUrl);
    window.location.href = redirectUrl;
  }
}
