import { Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-side-bar',
  standalone: true,
  imports: [],
  templateUrl: './dashboard-side-bar.component.html',
  styleUrl: './dashboard-side-bar.component.scss'
})
export class DashboardSideBarComponent {
  isSidebarHidden: boolean = false; // Sidebar starts hidden on small screens

  toggleSidebar() {
    this.isSidebarHidden = !this.isSidebarHidden; // Toggle between hidden and shown
  }
}
