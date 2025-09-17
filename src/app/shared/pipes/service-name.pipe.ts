import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'serviceName',
  standalone: true
})
export class ServiceNamePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return value;

    return value
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}