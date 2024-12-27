import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { first } from 'rxjs';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss'],
})
export class LogoutComponent implements OnInit {
  constructor(private authService: AuthService,private getProfileService:ProfileService) {
    this.authService.logout().pipe(first()).subscribe({
      next : (res)=>{
          localStorage.removeItem("foresighta-creds");
          localStorage.removeItem("currentUser");
          localStorage.removeItem("authToken");
          this.getProfileService.clearProfile()
          document.location.reload();
      },
      error: (err)=>{
        localStorage.removeItem("foresighta-creds");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("authToken");
        this.getProfileService.clearProfile()
        document.location.reload();
      }
    });
  }

  ngOnInit(): void {}
}
