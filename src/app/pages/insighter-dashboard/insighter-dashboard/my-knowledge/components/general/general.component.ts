import { Component } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { trigger, state, style, animate, transition } from '@angular/animations';

interface Item {
  name: string;
  size: string;
  price: number;
  id: string;
}

@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrls: ['./general.component.scss'],
  animations: [
    trigger('slideInOut', [
      state('void', style({
        transform: 'translateX(100%)',
        opacity: 0
      })),
      state('*', style({
        transform: 'translateX(0)',
        opacity: 1
      })),
      transition(':enter', [
        animate('300ms ease-out')
      ]),
      transition(':leave', [
        animate('300ms ease-in')
      ])
    ]),
    trigger('columnResize', [
      transition('* => *', [
        animate('300ms ease-out')
      ])
    ])
  ]
})
export class GeneralComponent {
  items: Item[] = [
    { id: '1', name: 'Item 1', size: 'Small', price: 10 },
    { id: '2', name: 'Item 2', size: 'Medium', price: 20 },
    { id: '3', name: 'Item 3', size: 'Large', price: 30 },
    // Add more items as needed
  ];

  packages: Item[] = [];
  showPackageBuilder = false;
  discount: number = 0;

  get totalPrice(): number {
    const subtotal = this.packages.reduce((sum, item) => sum + item.price, 0);
    return subtotal * (1 - this.discount / 100);
  }

  get subtotal(): number {
    return this.packages.reduce((sum, item) => sum + item.price, 0);
  }

  draggedItem: Item | null = null;

  constructor() {}

  onDragStart(event: DragEvent, item: Item) {
    if (event.dataTransfer) {
      this.draggedItem = item;
      event.dataTransfer.setData('text', JSON.stringify(item));
    }
  }

  onDragEnd(event: DragEvent) {
    this.draggedItem = null;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); // This is crucial!
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      const data = event.dataTransfer.getData('text');
      try {
        const item: Item = JSON.parse(data);
        if (item && !this.packages.some(pkg => pkg.id === item.id)) {
          this.packages = [...this.packages, item];
          console.log('Updated packages:', this.packages);
        }
      } catch (e) {
        console.error('Error parsing dropped item:', e);
      }
    }
  }

  togglePackageBuilder() {
    this.showPackageBuilder = !this.showPackageBuilder;
    if (!this.showPackageBuilder) {
      this.packages = [];
      this.discount = 0;
    }
  }

  updateDiscount(event: any) {
    const value = parseFloat(event.target.value);
    this.discount = isNaN(value) ? 0 : Math.min(Math.max(value, 0), 100);
  }

  removePackageItem(item: Item) {
    this.packages = this.packages.filter(pkg => pkg !== item);
  }

  savePackage() {
    // Implement save logic here
    console.log('Saving package:', this.packages);
  }

  cancelPackage() {
    this.packages = [];
  }
}