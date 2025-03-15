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
      
      // Clear storage first
      localStorage.removeItem("foresighta-creds");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");
      this.getProfileService.clearProfile();
      
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
  
  private redirectToMainDomain(): void {
    const timestamp = new Date().getTime();
    window.location.href = `${environment.mainAppUrl}/en?logged_out=true&t=${timestamp}`;
  }
}
