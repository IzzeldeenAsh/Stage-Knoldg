import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatTooltip'
})
export class FormatTooltipPipe implements PipeTransform {
  transform(value: string): string {
    return value.replace(/\n/g, '<br/>');
  }
}