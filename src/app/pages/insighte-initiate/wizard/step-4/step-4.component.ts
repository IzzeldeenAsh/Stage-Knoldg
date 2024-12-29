import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';

interface DraggableCard {
  title: string;
  price: number;
  type: string;
  colorClass: string;
  image: string;
}

interface Package {
  id: number;
  discount: number;
  totalPrice: number;
  items: DraggableCard[];
}

@Component({
  selector: 'app-step-4',
  templateUrl: './step-4.component.html',
  styleUrls: ['./step-4.component.scss']
})
export class Step4Component extends BaseComponent implements OnInit {
  name = 'Angular';

  cards: DraggableCard[] = [
    {
      title: 'Market Analysis Report',
      price: 12,
      type: 'PPTX',
      colorClass: 'danger',
      image: '/assets/images/market-analysis.png'
    },
    {
      title: 'Industry Overview',
      price: 25,
      type: 'DOCX',
      colorClass: 'info',
      image: '/assets/images/industry-overview.png'
    },
    {
      title: 'Growth Opportunities',
      price: 19,
      type: 'PDF',
      colorClass: 'warning',
      image: '/assets/images/growth-opportunities.png'
    },
    // Add more cards as needed
  ];

  packages: Package[] = [];
  packageIdCounter: number = 1;

  // Variables to keep track of the dragged card
  draggedCard: DraggableCard | null = null;

  ngOnInit(): void {
    // Initialize with one package if needed
    // this.addPackage();
  }

  addPackage(): void {
    this.packages.push({
      id: this.packageIdCounter++,
      discount: 0,
      totalPrice: 0,
      items: []
    });
  }

  removePackage(packageIndex: number): void {
    this.packages.splice(packageIndex, 1);
  }

  drop(event: any, packageIndex: number): void {
    const card: DraggableCard = event.dragData || this.draggedCard;
    const pkg = this.packages[packageIndex];

    if (card && !pkg.items.find(item => item.title === card.title)) {
      pkg.items.push(card);
      this.calculateTotalPrice(packageIndex);
      this.draggedCard = null; // Reset dragged card
    }
  }

  calculateTotalPrice(packageIndex: number): void {
    const pkg = this.packages[packageIndex];
    const subtotal = pkg.items.reduce((sum, item) => sum + item.price, 0);
    pkg.totalPrice = subtotal - ((pkg.discount / 100) * subtotal);
  }

  onDiscountChange(packageIndex: number, discount: number): void {
    this.packages[packageIndex].discount = discount;
    this.calculateTotalPrice(packageIndex);
  }

  submitPackage(packageIndex: number): void {
    const pkg = this.packages[packageIndex];
    // Handle package submission logic here
    console.log('Submitting Package:', pkg);
    // For example, send pkg to the server or perform other actions
  }

  // Add the missing dragStart and dragEnd methods
  dragStart(event: DragEvent, card: DraggableCard): void {
    this.draggedCard = card;
    console.log('Drag started for card:', card.title);
    // Optionally, you can add more logic here
  }

  dragEnd(event: DragEvent): void {
    console.log('Drag ended');
    this.draggedCard = null;
    // Optionally, reset any states or provide feedback
  }

  getOriginalPrice(pkg: any): number {
    return pkg.items.reduce((sum: number, item: any) => sum + item.price, 0);
  }
}