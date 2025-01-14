import { Component, Injector } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-knowledge-header',
  templateUrl: './knowledge-header.component.html',
})
export class KnowledgeHeaderComponent extends BaseComponent {
  totalSize: string = '2.6 GB';
  totalItems: number = 758;
  screenWidth: number = window.innerWidth;

  constructor(injector: Injector) {
    super(injector);
    // Listen for window resize events
    window.addEventListener('resize', () => {
      this.screenWidth = window.innerWidth;
    });
  }
  
} 