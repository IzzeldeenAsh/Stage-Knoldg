import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BaseComponent } from 'src/app/modules/base.component';
declare var bootstrap: any;

@Injectable({
  providedIn: 'root'
})
export class ToastService  {
  private toastElement: HTMLElement | null = null;
  private toastHeaderIcon: HTMLElement | null = null;
  private toastTitle: HTMLElement | null = null;
  private toastBody: HTMLElement | null = null;
  private toastTime: HTMLElement | null = null;
  private lang: string = 'en';
  
  // Arabic translations
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

  constructor(private translateService: TranslateService) {
    this.lang = this.translateService.currentLang;
    this.initializeToastElement();
    
    // Subscribe to language changes to update RTL settings
    this.translateService.onLangChange.subscribe((event) => {
      this.lang = event.lang;
      this.updateRTLSettings();
    });
  }

  private getLocalizedText(key: keyof typeof this.arabicTexts): string {
    return this.lang === 'ar' ? this.arabicTexts[key] : this.englishTexts[key];
  }

  private updateRTLSettings() {
    // Remove existing toast container to recreate with new RTL settings
    const existingContainer = document.querySelector('.toast-container');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    // Reset toast elements
    this.toastElement = null;
    this.toastHeaderIcon = null;
    this.toastTitle = null;
    this.toastBody = null;
    this.toastTime = null;
    
    // Reinitialize with new language settings
    this.initializeToastElement();
  }

  private initializeToastElement() {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      // Adjust positioning based on language direction
      const containerClass = this.lang === 'ar' 
        ? 'position-fixed top-0 start-0 p-3 z-index-99999 toast-container' 
        : 'position-fixed top-0 end-0 p-3 z-index-99999 toast-container';
      toastContainer.className = containerClass;
      document.body.appendChild(toastContainer);
    }

    // Create toast element if it doesn't exist
    if (!this.toastElement) {
      const toastHtml = `
        <div class="toast fade" role="alert" aria-live="assertive" aria-atomic="true" dir="${this.lang === 'ar' ? 'rtl' : 'ltr'}" style="min-width: 350px; max-width: 500px;">
          <div class="toast-header" style="text-align: ${this.lang === 'ar' ? 'right' : 'left'}; padding: 16px;">
            <i class="ki-duotone ki-notification-status fs-1 me-3">
              <span class="path1"></span>
              <span class="path2"></span>
              <span class="path3"></span>
              <span class="path4"></span>
            </i>
            <strong class="me-auto fs-4" style="direction: ${this.lang === 'ar' ? 'rtl' : 'ltr'}; text-align: ${this.lang === 'ar' ? 'right' : 'left'};"></strong>
            <small class="toast-time fs-6" style="direction: ${this.lang === 'ar' ? 'rtl' : 'ltr'}; text-align: ${this.lang === 'ar' ? 'right' : 'left'};"></small>
            <button type="button" class="btn-close fs-5" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
          <div class="toast-body fs-5" style="direction: ${this.lang === 'ar' ? 'rtl' : 'ltr'}; text-align: ${this.lang === 'ar' ? 'right' : 'left'}; padding: 16px;"></div>
        </div>
      `;

      toastContainer.innerHTML = toastHtml;
      const toast = toastContainer.querySelector('.toast') as HTMLElement;
      if (toast) {
        this.toastElement = toast;
        this.toastHeaderIcon = toast.querySelector('.ki-duotone') as HTMLElement || null;
        this.toastTitle = toast.querySelector('.me-auto') as HTMLElement || null;
        this.toastBody = toast.querySelector('.toast-body') as HTMLElement || null;
        this.toastTime = toast.querySelector('.toast-time') as HTMLElement || null;

        // Optional: Initialize Bootstrap toast with animations
        this.toastInstance = new bootstrap.Toast(this.toastElement, {
          animation: true, // Enables fade transitions
          autohide: true,
          delay: 5000
        });
      }
    }
  }

  private toastInstance: any;

  /**
   * Shows a toast notification with fade transitions.
   * @param message The message to display.
   * @param title The title of the toast.
   * @param type The type of toast ('success', 'error', 'warning', 'info', 'danger').
   * @param delay The time in milliseconds before the toast hides automatically. Defaults to 5000ms.
   */
  private show(
    message: string,
    title: string = 'Notification',
    type: 'success' | 'error' | 'warning' | 'info' | 'danger' = 'info',
    delay: number = 5000
  ) {
    if (!this.toastElement || !this.toastHeaderIcon || !this.toastTitle || !this.toastBody || !this.toastTime) {
      return;
    }

    // Set icon and color based on type
    let iconClass = '';
    switch(type) {
      case 'success':
        iconClass = 'ki-duotone ki-check-circle fs-1 me-3';
        break;
      case 'danger':
        iconClass = 'ki-duotone ki-cross-circle fs-1 me-3';
        break;
      case 'warning':
        iconClass = 'ki-duotone ki-information-5 fs-1 me-3';
        break;
      case 'info':
        iconClass = 'ki-duotone ki-information-5 fs-1 me-3';
        break;
      default:
        iconClass = 'ki-duotone ki-notification-status fs-1 me-3';
    }
    this.toastHeaderIcon.className = `${iconClass} text-${type}`;

    // Set content
    this.toastTitle.textContent = title;
    this.toastBody.textContent = message;
    this.toastTime.textContent = this.getLocalizedText('justNow');

    // Update delay if provided
    if (this.toastInstance) {
      this.toastInstance._config.delay = delay;
    }

    // Show toast using Bootstrap with fade transition
    this.toastInstance.show();
  }

  success(message: string = this.getLocalizedText('success'), title: string = this.getLocalizedText('success'), delay?: number) {
    title == '' ? title = this.getLocalizedText('success') : title;
    this.show(message, title, 'success', delay);
  }

  error(message: string = this.getLocalizedText('error'), title: string = this.getLocalizedText('error'), delay?: number) {
    title == '' ? title = this.getLocalizedText('error') : title;
    this.show(message, title, 'danger', delay);
  }

  warning(message: string = this.getLocalizedText('warning'), title: string = this.getLocalizedText('warning'), delay?: number) {
    title == '' ? title = this.getLocalizedText('warning') : title;
    this.show(message, title, 'warning', delay);
  }

  info(message: string = this.getLocalizedText('information'), title: string = this.getLocalizedText('information'), delay?: number) {
    title == '' ? title = this.getLocalizedText('information') : title;
    this.show(message, title, 'info', delay);
  }
}