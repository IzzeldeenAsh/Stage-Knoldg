import { Component, Input, OnInit } from '@angular/core';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-package-sidebar',
  templateUrl: './package-sidebar.component.html',
  styleUrls: ['./package-sidebar.component.scss'],
  animations: [
    trigger('slideInOut', [
      transition(':enter', [
        style({ width: '0', opacity: 0 }),
        animate('300ms ease-in', style({ width: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ width: '0', opacity: 0 }))
      ])
    ])
  ]
})
export class PackageSidebarComponent {
  @Input() isVisible = false;
  isDragging = false;
  packages: any[] = [];

 

  addNewPackage() {
    this.packages.push({
      items: [],
      discount: 0,
      totalPrice: 0
    });
  }

  updatePackageTotal(packageIndex: number) {
    const pkg = this.packages[packageIndex];
    const subtotal = pkg.items.reduce((sum: number, item: any) => sum + item.price, 0);
    pkg.totalPrice = subtotal * (1 - pkg.discount / 100);
  }

  onDrop(event: DragEvent, packageIndex: number): void {
    event.preventDefault(); // Prevent default behavior
    const data = event.dataTransfer?.getData('text'); // Extract the dropped item data
    if (data) {
      const item = JSON.parse(data); // Parse the data into an object
      this.packages[packageIndex].items.push(item); // Add the item to the package
      this.updatePackageTotal(packageIndex); // Recalculate totals
    }
    this.isDragging = false;
  }
  
  onDragEnter(): void {
    this.isDragging = true; // Optional: visual feedback for active drag
  }
  
  onDragLeave(): void {
    this.isDragging = false;
  }

  
}