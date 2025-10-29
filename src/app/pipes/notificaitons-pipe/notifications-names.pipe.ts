import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'notificationsNames',
  standalone: true
})
export class NotificationsNamesPipe implements PipeTransform {

  transform(value: string): string {
    switch (value) {
      case 'activate_company':
        return 'Activate Company';
      case 'deactivate_company':
        return 'Deactivate Company';
      case 'deactivate_company_with_delete':
        return 'Deactivate Company with Delete';
      case 'activate_insighter':
        return 'Activate Insighter';
      case 'deactivate_insighter':
        return 'Deactivate Insighter';
      case 'deactivate_insighter_with_delete':
        return 'Deactivate Insighter with Delete';
      case 'deactivate_delete_insighter':
        return 'Deactivate Delete Insighter';
      case 'deactivate_delete_company':
        return 'Deactivate Delete Company';
      case 'verified_company':
        return 'Verified Company';
      case 'verified_insighter':
        return 'Verified Insighter';
      case 'accept_knowledge':
        return 'Knowledge Request';
      case 'insighter_meeting_reminder':
        return 'Meeting Reminder';
      case 'client_meeting_reminder':
        return 'Meeting Reminder';
      case 'question_received':
        return 'Question Received';
      case 'client_meeting_new':
        return 'New Meeting Request';
      case 'insighter_meeting_client_new':
        return 'New Meeting Request';
      case 'insighter_meeting_approved':
        return 'Meeting Approved';
      case 'client_meeting_insighter_approved':
        return 'Meeting Approved';
      case 'client_meeting_insighter_postponed':
        return 'Meeting Postponed';
      case 'client_meeting_reschedule':
        return 'Meeting Rescheduled';
      case 'insighter_meeting_client_reschedule':
        return 'Meeting Rescheduled';
      default:
        return value;
    }
  }

}
