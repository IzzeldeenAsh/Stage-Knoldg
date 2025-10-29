import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'notificationsBg',
  standalone: true
})
export class NotificationsBgPipe implements PipeTransform {
  transform(type: string): string {
    switch (type) {
      case 'activate_company':
        return 'success';
      case 'deactivate_company':
      case 'deactivate_company_with_delete':
      case 'deactivate_delete_company':
        return 'danger';
      case 'activate_insighter':
        return 'info';
      case 'deactivate_insighter':
      case 'deactivate_insighter_with_delete':
      case 'deactivate_delete_insighter':
        return 'danger';
      case 'accept_knowledge':
        return 'info';
      default:
        return 'info';
    }
  }
}
