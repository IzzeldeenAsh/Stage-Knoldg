import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'notificationsLinks',
  standalone: true
})
export class NotificationsLinksPipe implements PipeTransform {

  transform(value: string, parent?: string): string {
    if (parent === 'admin') {
      return '/admin-dashboard/admin/dashboard/main-dashboard/requests';
    }
    return '/app/insighter-dashboard/my-dashboard';
  }

}
