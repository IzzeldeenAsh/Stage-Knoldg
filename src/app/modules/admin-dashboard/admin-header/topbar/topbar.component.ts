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
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
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
    private notificationService: NotificationsService,
    private http: HttpClient
  ) {}
  ngOnInit(): void {
    this.getProfile();
       
    // Subscribe to the notifications$ observable to receive updates from polling
    this.notificationService.notifications$.subscribe((notifications) => {
      this.notifications = notifications;
      // Count only unread notifications (where read_at is null or undefined)
      this.notificationCount = this.notifications.filter(n => !n.read_at).length;
    });

    // Start polling for notifications
    this.notificationService.startPolling();
 
  }
  signOut() {

    // Calculate timestamp to prevent caching
    const timestamp = new Date().getTime();
    
    // Create the redirect URI to the main domain
    const redirectUri = encodeURIComponent(`${environment.mainAppUrl}/en?logged_out=true&t=${timestamp}`);
    
    // Navigate to the logout route with the redirect URI
    window.location.href = `/auth/logout?redirect_uri=${redirectUri}`;

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
  handleClickOutside(event: MouseEvent): void {
    // Close user dropdown when clicking outside
    const target = event.target as HTMLElement;
    const clickedInside = this.elRef.nativeElement.contains(target);
    
    // Check if clicked in notifications area
    const clickedInNotification = target.closest('.notification-dropdown') || target.closest('.notification-toggle');
    
    // Only close menus if clicked outside
    if (!clickedInside && !clickedInNotification) {
      this.closeMenu();
      this.closeNotificationsMenu();
    }
  }

  // Toggle notifications menu
  toggleNotificationsMenu(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.notificationsMenuOpen = !this.notificationsMenuOpen;
    console.log('Notifications menu toggled:', this.notificationsMenuOpen);
    
    // If opening the notifications dropdown, mark all as read
    if (this.notificationsMenuOpen && this.notificationCount > 0) {
      // Immediately set notification count to 0 for UI feedback
      this.notificationCount = 0;
      
      const headers = new HttpHeaders({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Accept-Language': 'en'
      });
      
      // Call API to mark all notifications as read - using same endpoint as in primeng-header
      this.http.put('https://api.foresigha.co/api/account/notification/read', {}, { headers })
        .subscribe({
          next: () => {
            // Refresh notifications from API
            this.notificationService.getNotifications('en').subscribe(notifications => {
              this.notifications = notifications;
              // Only count unread notifications
              this.notificationCount = notifications.filter(n => !n.read_at).length;
            });
          },
          error: (error) => {
            console.error('Error marking all notifications as read:', error);
          }
        });
    }
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
    
    // Find the notification by ID
    const notification = this.notifications.find(n => n.id === notificationId);
    
    // Mark notification as read
    this.notificationService.markAsRead(notificationId,'en').subscribe({
      next: () => {
        // Refresh notifications from API
        this.notificationService.getNotifications('en').subscribe(notifications => {
          this.notifications = notifications;
          // Count only unread notifications
          this.notificationCount = notifications.filter(n => !n.read_at).length;
        });
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      }
    });

    // For admin, all notification types go to requests dashboard
    this.router.navigate(['/admin-dashboard/admin/dashboard/main-dashboard/requests']);
  }
}
