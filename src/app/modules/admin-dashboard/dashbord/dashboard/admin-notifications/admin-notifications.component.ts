import { Component } from '@angular/core';
interface INoitificationLayout{
  icon:string;
  bgColor:string;
  textColor:string;
  notificationNumber:number;
  notificationLabel:string;
}
enum notificationType {
    PENDING_USERS = 'Pending Users',
    PENDING_PAYMENTS = 'Pending Payments',
    CASE_CLAIMS= 'Case Claims',
    PRIZE_CLAIMS = 'Prize Claims'
}
@Component({
  selector: 'app-admin-notifications',
  templateUrl: './admin-notifications.component.html',
  styleUrls: ['./admin-notifications.component.scss']
})

export class AdminNotificationsComponent {
  adminNotificationList:INoitificationLayout[]=[
   
    {
      icon:'./assets/media/icons/figmaSVGs/dollar.svg',
      bgColor:'bg-warning',
      textColor:'text-gold',
      notificationNumber:14,
      notificationLabel:'Pending Payments'
    },
    {
      icon:'./assets/media/icons/figmaSVGs/pending-user.svg',
      bgColor:'bg-primary',
      textColor:'text-primary',
      notificationNumber:20,
      notificationLabel:'Pending Users'
    },
    {
      icon:'./assets/media/icons/figmaSVGs/claims.svg',
      bgColor:'bg-danger',
      textColor:'text-danger',
      notificationNumber:4,
      notificationLabel:'Case Claims'
    },
    {
      icon:'./assets/media/icons/figmaSVGs/claims.svg',
      bgColor:'bg-danger',
      textColor:'text-danger',
      notificationNumber:5,
      notificationLabel:'Prize Claims'
    }
    
  ]
}
