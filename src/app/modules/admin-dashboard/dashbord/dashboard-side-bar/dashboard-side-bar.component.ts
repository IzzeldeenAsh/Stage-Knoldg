import { Component, OnInit } from '@angular/core';
import { SidebarService } from '../../admin-services/sidebar.service';

@Component({
  selector: 'app-dashboard-side-bar',
  templateUrl: './dashboard-side-bar.component.html',
  styleUrl: './dashboard-side-bar.component.scss'
})
export class DashboardSideBarComponent implements OnInit {
  isSidebarHidden: boolean = false; // Sidebar is visible by default for larger screens

  constructor(private sidebarService: SidebarService) {}

  ngOnInit(): void {
    // Subscribe to the sidebar visibility state from the service
    this.sidebarService.sidebarVisible$.subscribe((isVisible) => {
      this.isSidebarHidden = !isVisible;
      console.log("isVisible",isVisible);
    });
  }

  toggleSidebar() {
    this.sidebarService.toggleSidebar();
  }
}