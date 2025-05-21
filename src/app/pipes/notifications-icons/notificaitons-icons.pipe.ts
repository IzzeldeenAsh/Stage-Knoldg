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
      default:
        return 'duotune/general/gen007.svg';
    }
  }
}
