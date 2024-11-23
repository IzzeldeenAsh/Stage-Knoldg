import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { ScrollAnimsService } from "src/app/_fake/services/scroll-anims/scroll-anims.service";
import { BaseComponent } from "src/app/modules/base.component";
import { AuthService } from "../../services/auth.service";
import { first } from "rxjs/operators";
import { AuthModel } from "../../models/auth.model";

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
    scrollAnims: ScrollAnimsService,
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService
  ) {
    super(scrollAnims);
  }

  ngOnInit(): void {
    // Extract query parameters from the URL
    const routeSub = this.route.queryParamMap.subscribe((params) => {
      this.token = params.get("token");
      const rolesParam = params.get("roles");
      console.log("tok", this.token);
      if (rolesParam) {
        this.roles = rolesParam.split(",").map((role) => role.trim());
      }
      if (this.token) {
        const auth = new AuthModel();
        auth.authToken = this.token;
        this.auth.setAuthFromLocalStorage(auth);
        this.toApp()
      } else {
        this.errorMessage = "Invalid callback parameters.";
      }
    });
    this.unsubscribe.push(routeSub);
  }

  toApp(): void {
    this.isSubmitting = true;
    this.auth
      .getProfile()
      .pipe(first())
      .subscribe({
        next:(user)=>{
          if (user && (user.roles.includes('admin') || user.roles.includes('staff'))) {
            this.router.navigate(['/admin-dashboard']);
          }
          if(user.verified){
            this.router.navigate(['/app']);
          }else{
            this.errorMessage ="Verification Failed";
            localStorage.removeItem('foresighta-creds');
            this.router.navigate(['auth'])
          }
        },
        error:(error)=>{
          this.errorMessage ="Verification Failed";
          localStorage.removeItem('foresighta-creds');
            this.router.navigate(['auth'])
        }
      })
      
  }
}
