import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs';
import { IForsightaProfile } from 'src/app/_fake/models/profile.interface';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { Notification, NotificationsService } from 'src/app/_fake/services/notifications/notifications.service';
import { AuthService } from 'src/app/modules/auth';
import { TranslationService } from 'src/app/modules/i18n';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit, OnDestroy {
  @Input() appHeaderDefaulMenuDisplay: boolean;
  @Input() isRtl: boolean;
  isUserMenuOpen = false;
  toolbarButtonMarginClass = 'ms-1 ms-lg-3';
  toolbarUserAvatarHeightClass = 'symbol-30px symbol-md-40px';
  notifications: any[] = [];
  isNotificationsOpen = false;
  // Toggle the user menu's visibility
  toggleUserMenu(): void {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }
  

  logout() {
    
    this.auth.logout().pipe(first()).subscribe({
      next:()=>{
        localStorage.removeItem("foresighta-creds");
        localStorage.removeItem("user");
        this.getProfileService.clearProfile()
        this.router.navigate(['/auth']).then(() => {
          // Optional: Reload the page after navigation if needed
         window.location.reload();
        });
      }
    });
  }

  // Close the user menu
  closeUserMenu(): void {
    this.isUserMenuOpen = false;
  }

  toggleNotifications() {
    this.isNotificationsOpen = !this.isNotificationsOpen;
  }

  closeNotifications() {
    this.isNotificationsOpen = false;
  }

  itemClass: string = 'ms-1 ms-lg-3';
  btnClass: string = 'btn btn-icon btn-custom btn-icon-muted btn-active-light btn-active-color-primary w-35px h-35px w-md-40px h-md-40px';
  userAvatarClass: string = 'symbol-35px symbol-md-40px';
  btnIconClass: string = 'fs-2 fs-md-1';
  userProfile:IForsightaProfile;
  isMenuOpen: boolean = false; 
  notificationCount: number = 0;
  lang : string = 'en';
  constructor(
    private auth: AuthService,
    private translationService: TranslationService,
    private router:Router,
    private getProfileService: ProfileService,
    private notificationService: NotificationsService
  ) {
    this.lang=this.translationService.getSelectedLanguage();
  }

  ngOnInit(): void {
    this.getProfileService.getProfile().subscribe((user)=>{
      this.userProfile=user
    });
    
    // Subscribe to the notifications$ observable to receive updates from polling
    this.notificationService.notifications$.subscribe((notifications) => {
      this.notifications = notifications;
      this.notificationCount = this.notifications.length;
    });

    // Start polling for notifications
    this.notificationService.startPolling();
  }

  // Add ngOnDestroy to clean up
  ngOnDestroy(): void {
    this.notificationService.stopPolling();
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  /**
   * Closes the dropdown menu.
   */
  closeMenu(): void {
    this.isUserMenuOpen = false
  }
  handleNotificationClick(notificationId: string) {
    // Mark notification as read
    this.notificationService.markAsRead(notificationId,this.lang).subscribe({
      next: () => {
        // Refresh notifications from API
        this.notificationService.getNotifications( this.lang ? this.lang : 'en').subscribe(notifications => {
          this.notifications = notifications;
          this.notificationCount = notifications.length;
        });
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      }
    });

    // Handle any other notification click logic (navigation, etc.)
    // ... existing notification click handling code ...
  }

}
