import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  Renderer2,
} from "@angular/core";
import { Router } from "@angular/router";
import { MessageService } from "primeng/api";
import { first } from "rxjs";
import { IKnoldgProfile } from "src/app/_fake/models/profile.interface";
import { ProfileService } from "src/app/_fake/services/get-profile/get-profile.service";
import { FileUploadService } from "src/app/_fake/services/upload-picture/upload-picture";
import { AuthService, UserType } from "src/app/modules/auth";
import { Notification, NotificationsService } from 'src/app/_fake/services/notifications/notifications.service';
@Component({
  selector: "app-topbar",
  templateUrl: "./topbar.component.html",
  styleUrls: ["./topbar.component.scss"],
})
export class TopbarComponent implements OnInit {
  user: IKnoldgProfile;
  itemClass: string = 'ms-1 ms-lg-3';
  btnClass: string = 'btn btn-icon btn-custom btn-icon-muted  btn-active-color-secondary w-35px h-35px w-md-40px h-md-40px';
  notifications: any[] = [];
  notificationsMenuOpen: boolean = false;
  
  constructor(
    private elRef: ElementRef,
    private renderer: Renderer2,
    private _auth: AuthService,
    private router: Router,
    private fileUploadService: FileUploadService,
    private messageService: MessageService,
    private getProfileService: ProfileService,
    private notificationService: NotificationsService
  ) {}
  ngOnInit(): void {
    this.getProfile();
       
    // Subscribe to the notifications$ observable to receive updates from polling
    this.notificationService.notifications$.subscribe((notifications) => {
      this.notifications = notifications;
      this.notificationCount = this.notifications.length;
    });

    // Start polling for notifications
    this.notificationService.startPolling();
 
  }
  signOut() {
    this.getProfileService.clearProfile()
    this._auth.logout().pipe(first()).subscribe({
      next:()=>{
        localStorage.removeItem("foresighta-creds");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("user");
        localStorage.removeItem("authToken");
        this.getProfileService.clearProfile()
        this.router.navigate(['/auth/login'])
      }
    });

  }

  getProfile(){
    this.getProfileService.getProfile().pipe(first()).subscribe({
      next :(res)=>{
        this.user = res
      },
      error:(error)=>{
        this.messageService.add({
          severity: "error",
          summary: "Error",
          detail: "Cannot get profile.",
        });
        this._auth.handleLogout().subscribe()
      }
    })
  }

  notificationCount: number = 0;

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      if (!file) {
        this.messageService.add({
          severity: "error",
          summary: "Error",
          detail: "No file selected",
        });
        return;
      }
      const validTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!validTypes.includes(file.type)) {
        this.messageService.add({
          severity: "error",
          summary: "Error",
          detail: "Invalid file type. Please upload a JPG, PNG, or WEBP file.",
        });
        return;
      }

      this.fileUploadService.uploadProfilePhoto(file).subscribe({
        next: (res) => {
          this.messageService.add({
            severity: "success",
            summary: "Success",
            detail: "Photo uploaded successfully",
          });
          this.getProfile()
        },
        error: (error) => {
          const errorMessage = error.error?.message || "Failed to upload photo";
          this.messageService.add({
            severity: "error",
            summary: "Error",
            detail: errorMessage,
          });
        },
      });
    }
  }

  isMenuOpen = false;
  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }
  @HostListener("document:click", ["$event"])
  handleClickOutside(event: Event): void {
    const clickedInside = this.elRef.nativeElement.contains(event.target);
    if (!clickedInside) {
      this.closeMenu();
    }
  }

  // Toggle notifications menu
  toggleNotificationsMenu(): void {
    this.notificationsMenuOpen = !this.notificationsMenuOpen;
  }

  // Close notifications menu
  closeNotificationsMenu(): void {
    this.notificationsMenuOpen = false;
  }

  // Handle click outside for notifications
  handleNotificationsClickOutside(): void {
    this.closeNotificationsMenu();
  }

   // Add ngOnDestroy to clean up
   ngOnDestroy(): void {
    this.notificationService.stopPolling();
  }


  handleNotificationClick(notificationId: string) {
    // Close the notifications menu when a notification is clicked
    this.closeNotificationsMenu();
    
    // Mark notification as read
    this.notificationService.markAsRead(notificationId,'en').subscribe({
      next: () => {
        // Refresh notifications from API
        this.notificationService.getNotifications( 'en').subscribe(notifications => {
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
