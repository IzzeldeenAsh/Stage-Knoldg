import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncateText',
  standalone: true
})
export class TruncateTextPipe implements PipeTransform {

  transform(value: string, limit: number = 50, completeWords: boolean = false, ellipsis: string = '...'): string {
    if (!value) return '';
    if (value.length <= limit) return value;

    if (completeWords) {
      let truncated = value.substr(0, limit);
      let lastSpace = truncated.lastIndexOf(' ');
      if (lastSpace > -1) {
        truncated = truncated.substr(0, lastSpace);
      }
      return truncated + ellipsis;
    }

    return value.substr(0, limit) + ellipsis;
  }

}
