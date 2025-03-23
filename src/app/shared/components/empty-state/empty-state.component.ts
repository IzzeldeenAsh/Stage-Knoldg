import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss']
})
export class EmptyStateComponent {
  @Input() title: string = '';
  @Input() message: string = '';
  @Input() icon: string = 'ki-journal-text'; // Default icon
  @Input() svgPath: string = ''; // Optional SVG path instead of icon
  @Input() showButton: boolean = false;
  @Input() buttonText: string = '';
  @Input() buttonLink: string = '';
  @Input() buttonIcon: string = 'ki-plus'; // Default button icon
  
  @Output() buttonClick = new EventEmitter<void>();
  
  onButtonClick(): void {
    this.buttonClick.emit();
  }
}
