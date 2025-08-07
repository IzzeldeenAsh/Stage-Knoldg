import { Component, Injector, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { BaseComponent } from 'src/app/modules/base.component';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { IKnoldgProfile } from 'src/app/_fake/models/profile.interface';

@Component({
  selector: "app-company-my-dashboard",
  templateUrl: "./company-my-dashboard.component.html",
  styleUrls: ["./company-my-dashboard.component.scss"],
})
export class CompanyMyDashboardComponent extends BaseComponent implements OnInit {
  userRole: string = '';
  userProfile: IKnoldgProfile | null = null;
  private destroy$ = new Subject<void>();
  showDonutChart = true;
  showEmployeeStats = true;

  constructor(
    injector: Injector,
    private profileService: ProfileService,
    private router: Router
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.getUserRole();
  }
  
  getUserRole(): void {
    this.profileService.getProfile().subscribe({
      next: (profile: IKnoldgProfile) => {
        this.userProfile = profile;
        if (profile.roles.includes('company')) {
          this.userRole = 'company';
        } else if (profile.roles.includes('client')) {
          this.userRole = 'client';
        } else if (profile.roles.includes('insighter')) {
          this.userRole = 'insighter';
        }
      },
      error: (error) => {
        console.error('Error getting user profile:', error);
      }
    });
  }

  onHasMultipleEmployees($event: boolean) {
    this.showEmployeeStats = $event;
    console.log("hasMultipleEmployees", $event);
  }

  onHasMultipleEmployeesDonut($event: boolean) {
    this.showDonutChart = $event;
    console.log("hasMultipleEmployeesDonut", $event);
  }
}
