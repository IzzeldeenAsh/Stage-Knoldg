import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiNotification {
  id: string;
  message: string;
  notifiable_group_id: string;
  notifiable_id: number;
  category: string | null;
  type: string;
  sub_type: string;
  tap: any;
  param: any;
  redirect_page: boolean;
  read_at: string;
}

export interface NotificationCountsMap {
  'contact-us': number;
  [key: string]: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminNotificationService {
  private notificationsSubject = new BehaviorSubject<ApiNotification[]>([]);
  private notificationCountsSubject = new BehaviorSubject<NotificationCountsMap>({
    'contact-us': 0
  });

  notifications$ = this.notificationsSubject.asObservable();
  notificationCounts$ = this.notificationCountsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.fetchNotifications();
  }

  fetchNotifications(): void {
    // Replace with your actual API endpoint
    this.http.get<{data: ApiNotification[]}>('/api/notifications')
      .subscribe(response => {
        this.notificationsSubject.next(response.data);
        this.updateNotificationCounts(response.data);
      });
  }

  private updateNotificationCounts(notifications: ApiNotification[]): void {
    const counts: NotificationCountsMap = {
      'contact-us': 0
    };

    notifications.forEach(notification => {
      if (notification.type in counts) {
        counts[notification.type]++;
      }
    });

    this.notificationCountsSubject.next(counts);
  }

  getContactUsNotifications(): Observable<ApiNotification[]> {
    return this.notifications$.pipe(
      map(notifications => notifications.filter(n => n.type === 'contact-us'))
    );
  }

  getContactUsCount(): Observable<number> {
    return this.notificationCounts$.pipe(
      map(counts => counts['contact-us'] || 0)
    );
  }
} 