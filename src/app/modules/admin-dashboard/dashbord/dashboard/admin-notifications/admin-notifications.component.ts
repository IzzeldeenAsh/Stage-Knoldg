import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AdminNotificationService, ApiNotification } from './admin-notification.service';
import { Subscription } from 'rxjs';

interface INoitificationLayout{
  icon:string;
  bgColor:string;
  textColor:string;
  notificationNumber:number;
  notificationLabel:string;
  type: notificationType;
  redirectPath?: string;
}

enum notificationType {
    PENDING_USERS = 'Pending Users',
    PENDING_PAYMENTS = 'Pending Payments',
    CASE_CLAIMS= 'Case Claims',
    PRIZE_CLAIMS = 'Prize Claims',
    CONTACT_US = 'Contact Us'
}

@Component({
  selector: 'app-admin-notifications',
  templateUrl: './admin-notifications.component.html',
  styleUrls: ['./admin-notifications.component.scss']
})

export class AdminNotificationsComponent implements OnInit, OnDestroy {
  adminNotificationList:INoitificationLayout[]=[
   
    {
      icon:'./assets/media/icons/figmaSVGs/dollar.svg',
      bgColor:'bg-warning',
      textColor:'text-gold',
      notificationNumber:14,
      notificationLabel:'Pending Payments',
      type: notificationType.PENDING_PAYMENTS
    },
    {
      icon:'./assets/media/icons/figmaSVGs/pending-user.svg',
      bgColor:'bg-primary',
      textColor:'text-primary',
      notificationNumber:20,
      notificationLabel:'Pending Users',
      type: notificationType.PENDING_USERS
    },
    {
      icon:'./assets/media/icons/figmaSVGs/claims.svg',
      bgColor:'bg-danger',
      textColor:'text-danger',
      notificationNumber:4,
      notificationLabel:'Case Claims',
      type: notificationType.CASE_CLAIMS
    },
    {
      icon:'./assets/media/icons/figmaSVGs/claims.svg',
      bgColor:'bg-danger',
      textColor:'text-danger',
      notificationNumber:5,
      notificationLabel:'Prize Claims',
      type: notificationType.PRIZE_CLAIMS
    },
    {
      icon:'./assets/media/icons/figmaSVGs/contact.svg',
      bgColor:'bg-info',
      textColor:'text-info',
      notificationNumber:0,
      notificationLabel:'Contact Us',
      type: notificationType.CONTACT_US,
      redirectPath: '/admin-dashboard/admin/contact-messages/contact-list'
    }
  ];

  private subscriptions: Subscription[] = [];
  contactUsNotifications: ApiNotification[] = [];

  constructor(
    private router: Router,
    private notificationService: AdminNotificationService
  ) {}
  
  ngOnInit(): void {
    // Subscribe to contact-us notifications count
    this.subscriptions.push(
      this.notificationService.getContactUsCount().subscribe(count => {
        // Update the Contact Us notification count
        const contactUsNotification = this.adminNotificationList.find(
          n => n.type === notificationType.CONTACT_US
        );
        if (contactUsNotification) {
          contactUsNotification.notificationNumber = count;
        }
      })
    );

    // Get contact-us notifications
    this.subscriptions.push(
      this.notificationService.getContactUsNotifications().subscribe(notifications => {
        this.contactUsNotifications = notifications;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  navigateToPage(notification: INoitificationLayout): void {
    if (notification.type === notificationType.CONTACT_US && notification.redirectPath) {
      this.router.navigate([notification.redirectPath]);
    }
  }
}
