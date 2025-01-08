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
export class PackageSidebarComponent implements OnInit {
  @Input() isVisible = false;
  packages: any[] = [];
  
  constructor() {}

  ngOnInit(): void {}

  addNewPackage() {
    this.packages.push({
      id: this.packages.length + 1,
      items: [],
      discount: 0,
      totalPrice: 0
    });
  }

  onDrop(event: any, packageIndex: number) {
    const item = event.dragData;
    if (item) {
      const pkg = this.packages[packageIndex];
      if (!pkg.items.find((i: any) => i.id === item.id)) {
        pkg.items.push(item);
        this.calculatePackageTotal(packageIndex);
      }
    }
  }

  private calculatePackageTotal(packageIndex: number) {
    const pkg = this.packages[packageIndex];
    const subtotal = pkg.items.reduce((sum: number, item: any) => sum + item.price, 0);
    pkg.totalPrice = subtotal - (subtotal * pkg.discount / 100);
  }
}