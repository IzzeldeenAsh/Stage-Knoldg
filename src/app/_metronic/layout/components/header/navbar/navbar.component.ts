import { Component, Input, OnInit } from '@angular/core';
import { Observable, first } from 'rxjs';
import { IForsightaProfile } from 'src/app/_fake/models/profile.interface';
import { AuthService, UserType } from 'src/app/modules/auth';
import { TranslationService } from 'src/app/modules/i18n';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {
  @Input() appHeaderDefaulMenuDisplay: boolean;
  @Input() isRtl: boolean;
  isUserMenuOpen = false;

  // Toggle the user menu's visibility
  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  // Close the user menu
  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  itemClass: string = 'ms-1 ms-lg-3';
  btnClass: string = 'btn btn-icon btn-custom btn-icon-muted btn-active-light btn-active-color-primary w-35px h-35px w-md-40px h-md-40px';
  userAvatarClass: string = 'symbol-35px symbol-md-40px';
  btnIconClass: string = 'fs-2 fs-md-1';
  userProfile:IForsightaProfile;
  constructor(
    private auth: AuthService,
    private translationService: TranslationService
  ) {}

  ngOnInit(): void {
    this.auth.getProfile().pipe(first()).subscribe((user)=>{
      this.userProfile=user
    })
  }

}
