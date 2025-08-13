import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BaseComponent } from 'src/app/modules/base.component';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class ToastService  {
  private lang: string = 'en';
  
  private arabicTexts = {
    success: 'نجح',
    error: 'خطأ', 
    warning: 'تحذير',
    information: 'معلومات',
    justNow: ''
  };
  
  private englishTexts = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',   
    information: 'Information',
    justNow: 'Just now'
  };

  constructor(
    private translateService: TranslateService,
    private messageService: MessageService
  ) {
    this.lang = this.translateService.currentLang;
    this.translateService.onLangChange.subscribe((event) => {
      this.lang = event.lang;
    });
  }

  private getLocalizedText(key: keyof typeof this.arabicTexts): string {
    return this.lang === 'ar' ? this.arabicTexts[key] : this.englishTexts[key];
  }

  private show(
    message: string,
    title: string = 'Notification',
    severity: 'success' | 'info' | 'warn' | 'error' = 'info',
    life: number = 5000
  ) {
    this.messageService.add({
      severity,
      summary: title,
      detail: message,
      life,
      styleClass: this.lang === 'ar' ? 'p-toast-rtl' : ''
    });
  }

  success(message: string = this.getLocalizedText('success'), title: string = this.getLocalizedText('success'), life?: number) {
    title = title === '' ? this.getLocalizedText('success') : title;
    this.show(message, title, 'success', life);
  }

  error(message: string = this.getLocalizedText('error'), title: string = this.getLocalizedText('error'), life?: number) {
    title = title === '' ? this.getLocalizedText('error') : title;
    this.show(message, title, 'error', life);
  }

  warning(message: string = this.getLocalizedText('warning'), title: string = this.getLocalizedText('warning'), life?: number) {
    title = title === '' ? this.getLocalizedText('warning') : title;
    this.show(message, title, 'warn', life);
  }

  info(message: string = this.getLocalizedText('information'), title: string = this.getLocalizedText('information'), life?: number) {
    title = title === '' ? this.getLocalizedText('information') : title;
    this.show(message, title, 'info', life);
  }

  clear() {
    this.messageService.clear();
  }
}