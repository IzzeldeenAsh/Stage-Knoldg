import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'notificationsLinks',
  standalone: true
})
export class NotificationsLinksPipe implements PipeTransform {

  transform(value: string): string {
    return '/app/profile/user-requests';
  }

}
