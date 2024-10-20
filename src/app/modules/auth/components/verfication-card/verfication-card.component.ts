import {  ChangeDetectorRef, Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { Observable, Subscription } from "rxjs";
import { CheckCodeEmailService } from "src/app/_fake/services/check-code/check-code-email.service";

@Component({
  selector: "app-verfication-card",
  templateUrl: "./verfication-card.component.html",
  styleUrl: "./verfication-card.component.scss",
})
export class VerficationCardComponent implements OnInit, OnDestroy {
  email: string = "****@email.com";
  code: string = "";
  hasError: boolean = false;
  private unsubscribe: Subscription[] = [];
  isLoading$: Observable<boolean>;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private _checkCode: CheckCodeEmailService,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {
    this.isLoading$ = this._checkCode.isLoading$;
  }
  ngOnInit(): void {
    this.getEmail();
  }

  resetError(){
    this.hasError=false;
    this.cdr.detectChanges()
  }

  //get email from param
  getEmail() {
    const email = this.route.snapshot.paramMap.get("email");
    if (email) {
      this.email = email;
    } else {
      this.router.navigate(["/auth/registration"]);
    }
  }

  submitCode() {
    this.hasError = false;
    const verifySub = this._checkCode
      .checkEmailcode(this.email, this.code)
      .subscribe({
        next: (res) => {
          if (res.state == false) {
            this.hasError = true;
            console.log("hasError", this.hasError);
            this.cdr.detectChanges(); // Trigger change detection
          }else{
            this.router.navigate(['/auth/wait'])
          }
        },
        error: (err) => {
          this.hasError = true;
          this.cdr.detectChanges(); // Trigger change detection
        },
      });
    this.unsubscribe.push(verifySub);
  }
  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
