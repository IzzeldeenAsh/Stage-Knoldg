import { Component } from '@angular/core';
import { SidebarService } from '../admin-services/sidebar.service';
@Component({
  selector: 'app-admin-header',
  templateUrl: './admin-header.component.html',
  styleUrls: ['./admin-header.component.scss']
})
export class AdminHeaderComponent {
  constructor(private sidebarService: SidebarService) {}

  toggleMobileSideBar(): void {
    this.sidebarService.toggleSidebar(); // Use service to toggle the sidebar
  }
}
