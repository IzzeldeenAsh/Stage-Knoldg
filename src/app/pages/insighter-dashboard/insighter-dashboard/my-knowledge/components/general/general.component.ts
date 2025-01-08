import { Component } from '@angular/core';

@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrl: './general.component.scss'
})
export class GeneralComponent {
  showPackageSidebar = false;
  items = [
    {
      name: 'Market Analysis Report',
      icon: 'ki-outline ki-file-pdf fs-2x text-danger me-4',
      type: 'Reports',
      typeIcon: 'fas fa-file-alt text-info mx-2 fs-6',
      size: '2.4 MB',
      price: 99.99
    },
  ];

  constructor() {}

  ngOnInit(): void {}

  togglePackageSidebar() {
    this.showPackageSidebar = !this.showPackageSidebar;
  }


  onDragStart(event: DragEvent, item: any): void {
    event.dataTransfer?.setData('text', JSON.stringify(item));
  }
  
  onDragEnd(): void {
    // Optional cleanup after dragging
  }
  
}