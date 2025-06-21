import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { MultiSelectModule } from 'primeng/multiselect';
import { FormsModule } from '@angular/forms';
import { EconomicBloc, EconomicBlockService } from '../../_fake/services/economic-block/economic-block.service';
import { InputTextModule } from 'primeng/inputtext';
import { TruncateTextPipe } from 'src/app/pipes/truncate-pipe/truncate-text.pipe';
import { TranslationModule } from 'src/app/modules/i18n';
import { ChipModule } from 'primeng/chip';

@Component({
  selector: 'app-select-economic-block',
  standalone: true,
  imports: [CommonModule, TranslationModule, DialogModule, MultiSelectModule, TruncateTextPipe, FormsModule, InputTextModule, ChipModule],
  templateUrl: './select-economic-block.component.html',
  styleUrls: ['./select-economic-block.component.scss']
})
export class SelectEconomicBlockComponent implements OnInit, OnChanges {
  @Input() placeholder: string = 'Select Economic Block...';
  @Input() title: string = 'Select Economic Blocks';
  @Output() blocksSelected = new EventEmitter<EconomicBloc[]>();
  @Input() selectedBlockIds: any[] | undefined = [];
  
  dialogVisible: boolean = false;
  economicBlocks: EconomicBloc[] = [];
  selectedBlocks: EconomicBloc[] = [];
  displayValue: string = '';

  constructor(private economicBlockService: EconomicBlockService) {}

  ngOnInit() {
    this.loadEconomicBlocks();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedBlockIds'] && this.economicBlocks.length > 0) {
      this.updateSelectedBlocks();
    }
  }

  loadEconomicBlocks() {
    this.economicBlockService.getEconomicBlocs().subscribe({
      next: (blocks) => {
        this.economicBlocks = blocks;
        this.updateSelectedBlocks();
      },
      error: (error) => {
        console.error('Error loading economic blocks:', error);
      }
    });
  }

  private updateSelectedBlocks() {
    if (this.selectedBlockIds && this.selectedBlockIds.length > 0 && this.economicBlocks.length > 0) {
      console.log('Updating selected blocks. SelectedBlockIds:', this.selectedBlockIds);
      console.log('Available economic blocks:', this.economicBlocks);
      
      this.selectedBlocks = this.economicBlocks.filter(block => {
        // Convert both to numbers for comparison to handle any type mismatches
        const blockId = Number(block.id);
        const isSelected = this.selectedBlockIds!.some(selectedId => Number(selectedId) === blockId);
        console.log(`Block ${block.name} (ID: ${blockId}) selected: ${isSelected}`);
        return isSelected;
      });
      
      console.log('Final selected blocks:', this.selectedBlocks);
      this.displayValue = this.selectedBlocks.map(block => block.name).join(', ');
    } else {
      this.selectedBlocks = [];
      this.displayValue = '';
    }
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

  getCountryFlagPath(flag: string): string {
   
    try { 
      return `../../../assets/media/flags/${flag}.svg`;
    } catch {
      return `../../../assets/media/flags/default.svg`;
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

  hasSelections(): boolean {
    return this.selectedBlocks && this.selectedBlocks.length > 0;
  }

  getSelectedDisplayItems(): string[] {
    return this.selectedBlocks.map(block => block.name);
  }
}