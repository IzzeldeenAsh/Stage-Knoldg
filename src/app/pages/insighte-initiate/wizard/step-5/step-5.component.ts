import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';

interface Chip {
  label: string;
  selected: boolean;
}

@Component({
  selector: 'app-step-5',
  templateUrl: './step-5.component.html',
  styleUrls: ['./step-5.component.scss']
})
export class Step5Component extends BaseComponent implements OnInit {
  keywords: string[] = [];
  availableKeywords: string[] = ['JavaScript', 'Programming', 'Frontend', 'Backend', 'UI/UX'];

  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit(): void {
  }

  chips: Chip[] = [
    { label: 'Technology', selected: false },
    { label: 'Finance', selected: false },
    { label: 'Healthcare', selected: false },
    { label: 'Education', selected: false },
    { label: 'Manufacturing', selected: false },
    { label: 'Energy', selected: false },
    { label: 'Real Estate', selected: false },
    { label: 'Retail', selected: false },
    { label: 'Transportation', selected: false },
    { label: 'Agriculture', selected: false },
    { label: 'Hospitality', selected: false },
    { label: 'Telecommunications', selected: false },
    { label: 'Construction', selected: false },
    { label: 'Automotive', selected: false },
    { label: 'Food and Beverage', selected: false },
  ];

  /**
   * Toggles the selection state of a single chip.
   * @param chip The chip to toggle.
   */
  toggleSelection(chip: Chip): void {
    chip.selected = !chip.selected;
  }

  /**
   * Selects all chips.
   */
  selectAll(): void {
    this.chips.forEach(chip => chip.selected = true);
  }

  /**
   * Clears the selection of all chips.
   */
  clearAll(): void {
    this.chips.forEach(chip => chip.selected = false);
  }
}
