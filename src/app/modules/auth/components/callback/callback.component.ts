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
    // Extract query parameters from the URL
    const routeSub = this.route.queryParamMap.subscribe((params) => {
      this.token = params.get("token");
      const rolesParam = params.get("roles");
      if (rolesParam) {
        this.roles = rolesParam.split(",").map((role) => role.trim());
      }
      if (this.token) {
        const auth = new AuthModel();
        auth.authToken = this.token;
        this.auth.setAuthInCookie(auth);
        this.toApp()
      } else {
        this.errorMessage = "Invalid callback parameters.";
      }
    });
    this.unsubscribe.push(routeSub);
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
            const authData = this.auth.getAuthFromCookie();
            if (authData && authData.authToken) {
              window.location.href = `${environment.mainAppUrl}/en/callback/${authData.authToken}`;
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
