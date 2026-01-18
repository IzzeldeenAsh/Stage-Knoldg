import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  OnDestroy,
  Renderer2,
  NgZone,
  ChangeDetectorRef,
} from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { MessageService } from "primeng/api";
import { first, filter } from "rxjs";
import { IKnoldgProfile } from "src/app/_fake/models/profile.interface";
import { ProfileService } from "src/app/_fake/services/get-profile/get-profile.service";
import { FileUploadService } from "src/app/_fake/services/upload-picture/upload-picture";
import { AuthService, UserType } from "src/app/modules/auth";
import { Notification, NotificationsService } from 'src/app/_fake/services/nofitications/notifications.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { TranslationService } from 'src/app/modules/i18n';
import { PusherClientService } from 'src/app/services/pusher-client.service';
import type { Channel } from 'pusher-js';
@Component({
  selector: "app-topbar",
  templateUrl: "./topbar.component.html",
  styleUrls: ["./topbar.component.scss"],
})
export class TopbarComponent implements OnInit, OnDestroy {
  user: IKnoldgProfile;
  itemClass: string = 'ms-1 ms-lg-3';
  btnClass: string = 'btn btn-icon btn-custom btn-icon-muted  btn-active-color-secondary w-35px h-35px w-md-40px h-md-40px';
  notifications: Notification[] = [];
  notificationsMenuOpen: boolean = false;
  currentLang: string = 'en';
  notificationCount: number = 0;
  private notificationChannel: Channel | null = null;
  private pusherGlobalHandler: ((eventName: string, data: any) => void) | null = null;
  
  constructor(
    private elRef: ElementRef,
    private renderer: Renderer2,
    private _auth: AuthService,
    private router: Router,
    private fileUploadService: FileUploadService,
    private messageService: MessageService,
    private getProfileService: ProfileService,
    private notificationService: NotificationsService,
    private http: HttpClient,
    private translationService: TranslationService,
    private pusherClient: PusherClientService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngOnInit(): void {
    this.currentLang = this.translationService.getSelectedLanguage();
    this.getProfile();

    // Subscribe to route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event) => {
      // Close notifications menu on route change
      this.closeNotificationsMenu();
    });
 
  }
  signOut() {

    // Calculate timestamp to prevent caching
    const timestamp = new Date().getTime();
    
    // Create the redirect URI to the main domain
    const redirectUri = encodeURIComponent(`${environment.mainAppUrl}/${this.currentLang}?logged_out=true&t=${timestamp}`);
    
    // Navigate to the logout route with the redirect URI
    window.location.href = `/auth/logout?redirect_uri=${redirectUri}`;

  }

  getProfile(){
    this.getProfileService.getProfile().pipe(first()).subscribe({
      next :(res)=>{
        this.user = res;
        
        // Fetch notifications once (no periodic polling)
        this.notificationService.getNotifications(this.currentLang || 'en').subscribe((notifications) => {
          this.notifications = notifications;
          this.notificationCount = this.notifications.filter(n => !n.read_at).length;
        });

        // Initialize realtime (Pusher) if available
        const token = this.getAuthToken();
        const userId = res?.id;
        if (userId && token) {
          this.initPusher(userId, token, this.currentLang || 'en');
        }
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
    
    // Note: We don't mark all as read when opening, individual notifications are marked when clicked
    // This matches the behavior in primeng-header component
  }

  // Close notifications menu
  closeNotificationsMenu(): void {
    this.notificationsMenuOpen = false;
  }

  // Handle click outside for notifications
  handleNotificationsClickOutside(): void {
    this.closeNotificationsMenu();
  }

  ngOnDestroy(): void {
    // Unsubscribe realtime
    try {
      if (this.user?.id) {
        this.pusherClient.unsubscribePrivateUser(this.user.id);
      }
      // Best-effort unbind global handler
      try {
        if (this.notificationChannel && this.pusherGlobalHandler) {
          (this.notificationChannel as any).unbind_global?.(this.pusherGlobalHandler);
        }
      } catch {}
      this.pusherClient.disconnect();
    } catch {}
  }


  handleNotificationClick(notificationId: string) {
    // Close the notifications menu when a notification is clicked
    this.closeNotificationsMenu();
    
    // Find the notification by ID
    const notification = this.notifications.find(n => n.id === notificationId);
    
    // Mark notification as read
    this.notificationService.markAsRead(notificationId, this.currentLang).subscribe({
      next: () => {
        // Refresh notifications from API
        this.notificationService.getNotifications(this.currentLang).subscribe(notifications => {
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

  // ---- Realtime helpers ----
  private getAuthToken(): string | null {
    try {
      // Cookie first (primary), then localStorage fallback.
      // Important: decode cookie value (token cookie is often URL-encoded).
      if (typeof document !== 'undefined') {
        const tokenPair = document.cookie
          .split(';')
          .map((c) => c.trim())
          .find((c) => c.startsWith('token='));
        if (tokenPair) {
          const raw = tokenPair.split('=').slice(1).join('=');
          const decoded = decodeURIComponent(raw);
          return decoded || null;
        }
      }
      return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    } catch {
      return null;
    }
  }

  private initPusher(userId: number, token: string, currentLocale: string) {
    try {
      // eslint-disable-next-line no-console
      // console.log('[Pusher] Initializing', {
      //   userId,
      //   locale: currentLocale,
      //   tokenPreview: token ? `${token.slice(0, 6)}…${token.slice(-4)}` : null
      // });

      const channel = this.pusherClient.subscribePrivateUser(userId, token, currentLocale);
      this.notificationChannel = channel;

      // Surface auth issues explicitly (otherwise it feels like "Pusher doesn't work")
      channel.bind('pusher:subscription_succeeded', () => {
        // eslint-disable-next-line no-console
        // console.log('[Pusher] Subscription succeeded', `private-user.${userId}`);
      });
      channel.bind('pusher:subscription_error', (status: any) => {
        // eslint-disable-next-line no-console
    //    console.warn('[Pusher] Subscription error', status, {
        //   channel: `private-user.${userId}`,
        //   hint: 'Check Authorization token + authEndpoint CORS + broadcasting/auth response'
        // });
      });

      // Log ALL events received on this channel (like your Next.js hook does)
      this.pusherGlobalHandler = (eventName: string, data: any) => {
        // eslint-disable-next-line no-console
        // console.log('[Pusher][GLOBAL EVENT]', eventName, data);
      };
      try {
        (channel as any).bind_global?.(this.pusherGlobalHandler);
      } catch {}

      const events = [
        'account.activated',
        'account.deactivated',
        'knowledge.accepted',
        'knowledge.declined',
        'order.insight',
        'knowledge.answer_question',
        'knowledge.ask_question',
        'meeting.client_meeting_insighter_approved',
        'meeting.client_meeting_insighter_postponed',
        'meeting.client_meeting_reminder',
        'meeting.client_meeting_new',
        'meeting.client_meeting_reschedule',
        'meeting.insighter_meeting_approved',
        'meeting.insighter_meeting_reminder',
        'meeting.insighter_meeting_client_new',
        'requests.action',
        'requests',
        'contact-us'
      ];
      events.forEach(evt => {
        channel.bind(evt, (data: any) => {
          // eslint-disable-next-line no-console
          // console.log('[Pusher] Event:', evt, data);

          // Pusher callbacks can run outside Angular's zone -> UI won't update unless we re-enter.
          this.ngZone.run(() => {
            const mapped = this.mapEventToNotification(data);
            // Prepend to local list
            this.notifications = [mapped, ...this.notifications];
            // Update unread count (new events are unread)
            this.notificationCount = this.notifications.filter(n => !n.read_at).length;
            // Ensure view refresh even if event arrives outside normal Angular change detection
            this.cdr.detectChanges();
          });
        });
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      // console.warn('[Pusher] init error', e);
    }
  }

  private mapEventToNotification(data: any): Notification {
    return {
      id: data?.id ?? `evt-${Date.now()}`,
      message: data?.message ?? '',
      type: data?.type ?? 'notification',
      notifiable_group_id: data?.notifiable_group_id ?? '',
      notifiable_id: data?.notifiable_id ?? 0,
      request_id: data?.request_id ?? 0,
      param: data?.param ?? null,
      sub_type: data?.sub_type ?? 'info',
      redirect_page: !!data?.redirect_page,
      read_at: undefined,
      sub_page: data?.sub_page,
      tap: data?.tap,
      category: data?.category,
    };
  }
}
