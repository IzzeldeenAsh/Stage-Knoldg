import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.scss']
})
export class PageHeaderComponent {
  @Input() titleKey: string = '';
  @Input() titleEn: string = '';
  @Input() titleAr: string = '';
  @Input() subtitleKey?: string;
  @Input() subtitleEn?: string;
  @Input() subtitleAr?: string;
  @Input() subtitle?: string; // For dynamic subtitles
  @Input() lang: string = 'en';
  @Input() showTabs: boolean = false;

  getLocalizedTitle(): string {
    if (this.titleEn && this.titleAr) {
      return this.lang === 'ar' ? this.titleAr : this.titleEn;
    }
    return this.titleKey || '';
  }

  getLocalizedSubtitle(): string {
    if (this.subtitle) {
      return this.subtitle; // For dynamic subtitles
    }
    if (this.subtitleEn && this.subtitleAr) {
      return this.lang === 'ar' ? this.subtitleAr : this.subtitleEn;
    }
    return this.subtitleKey || '';
  }
}