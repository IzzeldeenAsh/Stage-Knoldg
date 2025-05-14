import { Component, Injector, OnDestroy, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { ScrollAnimsService } from "src/app/_fake/services/scroll-anims/scroll-anims.service";
import { BaseComponent } from "src/app/modules/base.component";
import { AuthService } from "../../services/auth.service";
import { first } from "rxjs/operators";
import { AuthModel } from "../../models/auth.model";
import { ProfileService } from "src/app/_fake/services/get-profile/get-profile.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-callback",
  templateUrl: "./callback.component.html",
  styleUrls: ["./callback.component.scss"],
})
export class CallbackComponent
  extends BaseComponent
  implements OnInit, OnDestroy
{
  user: any;
  token: string | null = null;
  roles: string[] = [];
  errorMessage: string | null = null;
  isSubmitting: boolean = false;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    injector: Injector,
    private getProfileService: ProfileService
  ) {
    super(injector);
    // Now you can use someOtherService alongside base services
  }

  ngOnInit(): void {
    // First check for token in query parameters
    const routeSub = this.route.queryParamMap.subscribe((params) => {
      this.token = params.get("token");
      const rolesParam = params.get("roles");
      if (rolesParam) {
        this.roles = rolesParam.split(",").map((role) => role.trim());
      }
      
      if (this.token) {
        const auth = new AuthModel();
        auth.authToken = this.token;
        this.auth.setAuthInLocalStorage(auth);
        this.toApp();
      } else {
        // If no token in query params, check URL path for backward compatibility
        this.route.params.subscribe(params => {
          if (params['token']) {
            const auth = new AuthModel();
            auth.authToken = params['token'];
            this.auth.setAuthInLocalStorage(auth);
            this.toApp();
          } else {
            this.errorMessage = "Invalid callback parameters.";
          }
        });
      }
    });
    this.unsubscribe.push(routeSub);
  }

  // Get return URL from cookie
  private getReturnUrlFromCookie(): string | null {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'auth_return_url') {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  toApp(): void {
    this.isSubmitting = true;
    this.getProfileService
      .getProfile()
      .pipe(first())
      .subscribe({
        next:(user)=>{
          if (user && (user.roles.includes('admin') || user.roles.includes('staff'))) {
            this.router.navigate(['/admin-dashboard']);
          }
          if(user.verified){
            const authData = this.auth.getAuthFromLocalStorage();
            if (authData && authData.authToken) {
              // Check for return URL in cookie
              const returnUrl = this.getReturnUrlFromCookie();
              // Build the redirect URL including the returnUrl if available
              let redirectUrl = `${environment.mainAppUrl}/en/callback?token=${authData.authToken}`;
              if (returnUrl) {
                redirectUrl += `&returnUrl=${encodeURIComponent(returnUrl)}`;
              }
              window.location.href = redirectUrl;
            }
          }else{
            this.errorMessage ="Verification Failed";
            this.auth.handleLogout().subscribe();
            this.router.navigate(['auth'])
          }
        },
        error:(error)=>{
          this.errorMessage ="Verification Failed";
          this.auth.handleLogout().subscribe();
          this.router.navigate(['auth'])
        }
      })
      
  }
}
