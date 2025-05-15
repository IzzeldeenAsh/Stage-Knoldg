import { Injectable } from '@angular/core';
declare var bootstrap: any;

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastElement: HTMLElement | null = null;
  private toastHeaderIcon: HTMLElement | null = null;
  private toastTitle: HTMLElement | null = null;
  private toastBody: HTMLElement | null = null;
  private toastTime: HTMLElement | null = null;

  constructor() {
    this.initializeToastElement();
  }

  private initializeToastElement() {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'position-fixed top-0 end-0 p-3 z-index-1000 toast-container';
      document.body.appendChild(toastContainer);
    }

    // Create toast element if it doesn't exist
    if (!this.toastElement) {
      const toastHtml = `
        <div class="toast fade" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="toast-header">
            <i class="ki-duotone ki-notification-status fs-2 me-3">
              <span class="path1"></span>
              <span class="path2"></span>
              <span class="path3"></span>
              <span class="path4"></span>
            </i>
            <strong class="me-auto"></strong>
            <small class="toast-time"></small>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
          <div class="toast-body"></div>
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
        iconClass = 'ki-duotone ki-check-circle fs-2 me-3';
        break;
      case 'danger':
        iconClass = 'ki-duotone ki-cross-circle fs-2 me-3';
        break;
      case 'warning':
        iconClass = 'ki-duotone ki-information-5 fs-2 me-3';
        break;
      case 'info':
        iconClass = 'ki-duotone ki-information-5 fs-2 me-3';
        break;
      default:
        iconClass = 'ki-duotone ki-notification-status fs-2 me-3';
    }
    this.toastHeaderIcon.className = `${iconClass} text-${type}`;

    // Set content
    this.toastTitle.textContent = title;
    this.toastBody.textContent = message;
    this.toastTime.textContent = 'Just now';

    // Update delay if provided
    if (this.toastInstance) {
      this.toastInstance._config.delay = delay;
    }

    // Show toast using Bootstrap with fade transition
    this.toastInstance.show();
  }

  success(message: string='Success', title: string = 'Success', delay?: number) {
    title =='' ? title = 'Success' : title;
    this.show(message, title, 'success', delay);
  }

  error(message: string='Error', title: string = 'Error', delay?: number) {
    title =='' ? title = 'Error' : title;
    this.show(message, title, 'danger', delay);
  }

  warning(message: string='Warning', title: string = 'Warning', delay?: number) {
    title =='' ? title = 'Warning' : title;
    this.show(message, title, 'warning', delay);
  }

  info(message: string='Information', title: string = 'Information', delay?: number) {
    title =='' ? title = 'Information' : title;
    this.show(message, title, 'info', delay);
  }
}