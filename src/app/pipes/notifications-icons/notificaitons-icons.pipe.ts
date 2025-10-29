import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'notificationsIcons',
  standalone: true
})
export class NotificationsIconsPipe implements PipeTransform {
  transform(type: string): string {
    switch (type) {
      case 'deactivate_company':
      case 'deactivate_company_with_delete':
      case 'deactivate_insighter':
      case 'deactivate_insighter_with_delete':
        return 'duotune/general/gen047.svg';
      case 'activate_company':
      case 'activate_insighter':
        return 'duotune/arrows/arr086.svg';
      case 'accept_knowledge':
        return 'duotune/files/fil025.svg';
      case 'client_meeting_insighter_approved':
      case 'client_meeting_new':
        return 'duotune/general/gen014.svg';
      case 'insighter_meeting_client_new':
      case 'insighter_meeting_approved':
        return 'duotune/general/gen014.svg'
      case 'client_meeting_insighter_postponed':
        return 'duotune/general/gen014.svg';
      case 'client_meeting_reschedule':
        return 'duotune/general/gen014.svg';
      case 'insighter_meeting_client_reschedule':
        return 'duotune/general/gen014.svg';
      case 'insighter_meeting_reminder':
        return 'duotune/general/gen014.svg';
      case 'client_meeting_reminder':
        return 'duotune/general/gen014.svg';
      default:
        return 'duotune/general/gen007.svg';
    }
  }
}
