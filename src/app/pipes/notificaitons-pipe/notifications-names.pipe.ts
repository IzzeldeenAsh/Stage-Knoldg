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
      default:
        return value;
    }
  }

}
