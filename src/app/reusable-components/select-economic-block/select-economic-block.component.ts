import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';
import { EconomicBloc, EconomicBlockService } from '../../_fake/services/economic-block/economic-block.service';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-select-economic-block',
  standalone: true,
  imports: [CommonModule, DialogModule, MultiSelectModule, FormsModule, InputTextModule],
  templateUrl: './select-economic-block.component.html',
  styleUrls: ['./select-economic-block.component.scss']
})
export class SelectEconomicBlockComponent implements OnInit {
  @Input() placeholder: string = 'Select Economic Block...';
  @Input() title: string = 'Select Economic Blocks';
  @Output() blocksSelected = new EventEmitter<EconomicBloc[]>();

  dialogVisible: boolean = false;
  economicBlocks: EconomicBloc[] = [];
  selectedBlocks: EconomicBloc[] = [];
  displayValue: string = '';

  constructor(private economicBlockService: EconomicBlockService) {}

  ngOnInit() {
    this.loadEconomicBlocks();
  }

  loadEconomicBlocks() {
    this.economicBlockService.getEconomicBlocs().subscribe({
      next: (blocks) => {
        this.economicBlocks = blocks;
      },
      error: (error) => {
        console.error('Error loading economic blocks:', error);
      }
    });
  }

  showDialog() {
    this.dialogVisible = true;
  }

  onBlocksSelect(blocks: EconomicBloc[]) {
    this.selectedBlocks = blocks;
    this.displayValue = this.selectedBlocks.map(block => block.name).join(', ');
  }

  onConfirm() {
    if (this.selectedBlocks && this.selectedBlocks.length > 0) {
      this.blocksSelected.emit(this.selectedBlocks);
    }
    this.dialogVisible = false;
  }

  getCountryFlagPath(countryName: string): string {
    const countryCode = this.getCountryCode(countryName);
    const countryCodeSmall = countryCode.toLowerCase();
    try {
      return `../../../../assets/media/flags/${countryCodeSmall}.svg`;
    } catch {
      return `../../../../assets/media/flags/default.svg`;
    }
  }

  getCountryCode(countryName: string): string {
    // Implement a method to convert country name to country code
    // This can be a lookup from a predefined list or an API call
    // For example purposes, returning a placeholder
    const countryCodes: { [key: string]: string } = {
      'United States': 'US',
      'Canada': 'CA',
      'Germany': 'DE',
      // Add more mappings as needed
    };
    return countryCodes[countryName] || 'un';
  }

  onFlagError(event: any) {
    event.target.src = `../../../../assets/media/flags/default.svg`;
  }
}