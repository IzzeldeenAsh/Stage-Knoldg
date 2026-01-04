import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'notificationsIcons',
  standalone: true
})
export class NotificationsIconsPipe implements PipeTransform {
  transform(type: string): string {
    switch (type) {
      case 'knowledge': // used as sub_type for order notifications
        return 'duotune/notificaitons/knowledge.svg';
      case 'deactivate_company':
      case 'deactivate_company_with_delete':
      case 'deactivate_insighter':
      case 'deactivate_insighter_with_delete':
        return 'duotune/notificaitons/deactivate.svg';
      case 'activate_company':
      case 'activate_insighter':
        return 'duotune/notificaitons/activate.svg';
      case 'declined':
      case 'knowledge_declined':
          return 'duotune/notificaitons/decline.svg';
      case 'accept_knowledge':
        return 'duotune/notificaitons/accept_knlg.svg';
      case 'client_meeting_insighter_approved':
        return 'duotune/notificaitons/accept_mtg.svg';
      case 'client_meeting_new':
        return 'duotune/notificaitons/mtg.svg';
      case 'insighter_meeting_client_new':
         return 'duotune/notificaitons/mtg.svg'
      case 'insighter_meeting_approved':
        return 'duotune/notificaitons/accept_mtg.svg'
      case 'client_meeting_insighter_postponed':
        return 'duotune/notificaitons/postp_mtg.svg';
      case 'client_meeting_reschedule':
        return 'duotune/notificaitons/mtg.svg';
      case 'insighter_meeting_client_reschedule':
        return 'duotune/notificaitons/mtg.svg';
      case 'insighter_meeting_reminder':
        return 'duotune/notificaitons/mtg.svg';
      case 'client_meeting_reminder':
        return 'duotune/notificaitons/mtg.svg';
      default:
        return 'duotune/general/gen007.svg';
    }
  }
}
