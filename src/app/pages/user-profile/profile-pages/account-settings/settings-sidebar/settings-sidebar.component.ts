import { Component, Injector, OnInit } from '@angular/core';
import { AuthService } from 'src/app/modules/auth';
import { BaseComponent } from 'src/app/modules/base.component';
import Swal from 'sweetalert2';
interface MenuItem {
  title: string;
  route: string;
  roles?: string[];
  isActive?: boolean;
  iconSource?: string;
}

@Component({
  selector: 'app-settings-sidebar',
  templateUrl: './settings-sidebar.component.html',
  styleUrl: './settings-sidebar.component.scss'
})
export class SettingsSidebarComponent extends BaseComponent implements OnInit {
  roles: string[] = [];
  isLoading: boolean = false;
  isSocialLogin: boolean = false;
  // isActive: boolean = false;
  menuItems: MenuItem[] = [
    {
      title: this.lang === 'ar' ? 'البيانات الشخصية' : 'Personal Info',
      route: '/app/profile/settings/personal-info',
      roles: ['company', 'insighter','client'],
    },
    {
      title: this.lang === 'ar' ? 'بيانات الشركة' : 'Company Info',
      route: '/app/profile/settings/company-settings',
      roles: ['company'],
    }
  ];
  constructor(
    injector: Injector,
    private readonly _profileService: AuthService,
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.getProfile();
  }

  getProfile(){
    this.isLoading = true;
    const profileSubscription = this._profileService.getProfile().subscribe((profile) => {
      this.roles = profile.roles;
      this.isSocialLogin = profile.login_social === true;
      
      // if(profile.comapny){
      //   this.isActive = profile.comapny.status === 'active';
      // }else if(profile.roles.includes('insighter')){
      //   this.isActive = profile.insighter_status === 'active';
      // }else if(profile.roles.includes('client')){
      //   this.isActive = profile.client_status === 'active';
      // }
      this.initializeMenuItems()
      this.isLoading = false;
    });
    this.unsubscribe.push(profileSubscription);
  }

  initializeMenuItems() {
    this.menuItems = [
      {
        title: this.lang === 'ar' ? 'البيانات الشخصية' : 'Personal Info',
        route: '/app/profile/settings/personal-info',
        roles: ['company', 'insighter', 'client'],
        iconSource: 'assets/media/svg/profile-icons/profileInfoIcon.svg',
        // isActive: this.isActive
      },
      {
        title: this.lang === 'ar' ? 'بيانات الشركة' : 'Company Info',
        route: '/app/profile/settings/company-settings',
        roles: ['company'],
        iconSource: 'assets/media/svg/profile-icons/companyInfoIcon.svg',
        // isActive: this.isActive
      }
    ];

    // Only add reset password option for non-social login users
    if (!this.isSocialLogin) {
      this.menuItems.push({
        title: this.lang === 'ar' ? 'تغيير كلمة المرور' : 'Reset Password',
        route: '/app/profile/settings/reset-password',
        roles: ['client'],
        iconSource: 'assets/media/svg/profile-icons/resetPassIcon.svg',
      });
    }

    // if (this.isActive) {
    //   this.menuItems.push({
    //     title: this.lang === 'ar' ? 'الإعدادات' : 'Settings',
    //     route: '/app/profile/settings/settings-action',
    //     roles: ['company', 'insighter', 'client'],
    //     isActive: this.isActive
    //   });
    // }
  }

  hasRole(role: string[]): boolean {
    return this.roles.some(r => role.includes(r));
  }
}
