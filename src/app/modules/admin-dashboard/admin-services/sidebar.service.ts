import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SidebarService {
  // The sidebar visibility state
  private sidebarVisibleSubject = new BehaviorSubject<boolean>(true); // True by default for larger screens
  sidebarVisible$ = this.sidebarVisibleSubject.asObservable();

  constructor() {
    this.checkScreenSize();
    // Listen to window resize event
    window.addEventListener('resize', this.checkScreenSize.bind(this));
  }

  toggleSidebar(): void {
    // Toggle the current state if screen is smaller than 992px
    const screenWidth = window.innerWidth;
    if (screenWidth < 992) {
      this.sidebarVisibleSubject.next(!this.sidebarVisibleSubject.value);
    }
  }

  private checkScreenSize(): void {
    const screenWidth = window.innerWidth;
    if (screenWidth >= 992) {
      // Always show the sidebar for screens wider than 992px
      this.sidebarVisibleSubject.next(true);
    } else {
      // Hide the sidebar on smaller screens by default
      this.sidebarVisibleSubject.next(false);
    }
  }
}