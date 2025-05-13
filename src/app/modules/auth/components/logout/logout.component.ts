import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { first } from 'rxjs';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss'],
})
export class LogoutComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private getProfileService: ProfileService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check if we have a redirect URL from query parameters
    this.route.queryParams.subscribe(params => {
      const redirectUri = params['redirect_uri'];
      
      // Clear ALL possible localStorage keys from both apps
      localStorage.removeItem('foresighta-creds');  // Angular format
      localStorage.removeItem('currentUser');        // Angular user data
      localStorage.removeItem('user');              // Next.js user data
      localStorage.removeItem('token');             // Next.js format
      localStorage.removeItem('authToken');         // Possible direct token storage
      
      // Clear service caches
      this.getProfileService.clearProfile();
      
      // Clear auth cookies
      this.clearAuthCookies();
      
      // Check if we also need to notify the Next.js app about logout
      const shouldNotifyNextJsApp = !redirectUri?.includes(environment.mainAppUrl);
      
      // If logout originated from Angular and no redirect is specified, notify Next.js app
      if (shouldNotifyNextJsApp && !redirectUri) {
        // Create an iframe to silently trigger logout on Next.js app
        const nextJsLogoutFrame = document.createElement('iframe');
        nextJsLogoutFrame.style.display = 'none';
        nextJsLogoutFrame.src = `${environment.mainAppUrl}/en/signout`;
        document.body.appendChild(nextJsLogoutFrame);
        
        // Remove iframe after 2 seconds
        setTimeout(() => {
          try {
            document.body.removeChild(nextJsLogoutFrame);
          } catch (e) {
            console.log('Frame already removed');
          }
        }, 2000);
      }
      
      // If we have a redirect URI, use it
      if (redirectUri) {
        window.location.href = redirectUri;
        return;
      }
      
      // Otherwise, perform normal logout and redirect to main domain
      this.authService.logout().pipe(first()).subscribe({
        next: () => this.redirectToMainDomain(),
        error: () => this.redirectToMainDomain()
      });
    });
  }
  
  private clearAuthCookies(): void {
    // Helper function to remove cookies properly from all possible domains
    const removeCookie = (name: string) => {
      // Remove from current domain
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      
      // Remove from root domain with same settings as creation
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; Domain=.knoldg.com; Secure; SameSite=None;`;
    };
    
    // Clear all possible auth cookies
    removeCookie('token');
    removeCookie('auth_token');
    removeCookie('auth_user');
  }
  
  private redirectToMainDomain(): void {
    const timestamp = new Date().getTime();
    window.location.href = `${environment.mainAppUrl}/en?logged_out=true&t=${timestamp}`;
  }
}
