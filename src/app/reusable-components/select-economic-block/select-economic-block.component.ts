import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { EconomicBloc, EconomicBlockService } from '../../_fake/services/economic-block/economic-block.service';
import { InputTextModule } from 'primeng/inputtext';
import { TruncateTextPipe } from 'src/app/pipes/truncate-pipe/truncate-text.pipe';
import { TranslationModule } from 'src/app/modules/i18n';
import { ChipModule } from 'primeng/chip';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { normalizeSearchText } from 'src/app/utils/search-normalize';

@Component({
  selector: 'app-select-economic-block',
  standalone: true,
  imports: [CommonModule, TranslationModule, DialogModule, TruncateTextPipe, FormsModule, InputTextModule, ChipModule],
  templateUrl: './select-economic-block.component.html',
  styleUrls: ['./select-economic-block.component.scss']
})
export class SelectEconomicBlockComponent implements OnInit, OnChanges, OnDestroy {
  @Input() placeholder: string = 'Select Economic Block...';
  @Input() title: string = 'Select Economic Blocks';
  @Output() blocksSelected = new EventEmitter<EconomicBloc[]>();
  @Input() selectedBlockIds: any[] | undefined = [];
  
  dialogVisible: boolean = false;
  economicBlocks: EconomicBloc[] = [];
  filteredBlocks: EconomicBloc[] = [];
  selectedBlocks: EconomicBloc[] = [];
  displayValue: string = '';
  searchQuery: string = '';

  private search$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  private blocksIndex: Array<{ block: EconomicBloc; normName: string }> = [];

  constructor(private economicBlockService: EconomicBlockService) {}

  ngOnInit() {
    this.loadEconomicBlocks();

    // Debounce filtering so typing stays responsive.
    this.search$
      .pipe(
        debounceTime(120),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((q) => {
        this.applyFilter(q);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedBlockIds']) {
      
      if (this.economicBlocks.length > 0) {
        this.updateSelectedBlocks();
      }
    }
  }

  loadEconomicBlocks() {
    this.economicBlockService.getEconomicBlocs().subscribe({
      next: (blocks) => {
        this.economicBlocks = blocks;
        this.blocksIndex = this.economicBlocks.map((b) => ({
          block: b,
          normName: normalizeSearchText(b.name),
        }));
        this.filteredBlocks = [...this.economicBlocks];
        this.updateSelectedBlocks();
      },
      error: (error) => {
        console.error('Error loading economic blocks:', error);
      }
    });
  }

  private updateSelectedBlocks() {
    
    if (this.selectedBlockIds && this.selectedBlockIds.length > 0 && this.economicBlocks.length > 0) {
      
      this.selectedBlocks = this.economicBlocks.filter(block => {
        // Convert both to numbers for comparison to handle any type mismatches
        const blockId = Number(block.id);
        const isSelected = this.selectedBlockIds!.some(selectedId => Number(selectedId) === blockId);
        return isSelected;
      });
      
      this.updateDisplayValue();
    } else {
      this.selectedBlocks = [];
      this.updateDisplayValue();
    }
  }

  showDialog() {
    this.dialogVisible = true;
    this.searchQuery = '';
    this.filteredBlocks = [...this.economicBlocks];
    this.search$.next('');
  }

  /**
   * Checks if a block is selected
   */
  isBlockSelected(block: EconomicBloc): boolean {
    return this.selectedBlocks.some(selectedBlock => selectedBlock.id === block.id);
  }

  /**
   * Toggles the selection of a block
   */
  toggleSelectBlock(block: EconomicBloc, event: any) {
    const checked = event.target.checked;
    
    if (checked) {
      if (!this.selectedBlocks.some(selectedBlock => selectedBlock.id === block.id)) {
        this.selectedBlocks.push(block);
      }
    } else {
      this.selectedBlocks = this.selectedBlocks.filter(selectedBlock => selectedBlock.id !== block.id);
    }
    this.updateDisplayValue();
  }

  /**
   * Toggles the selection of a block when clicking on the card
   */
  toggleBlockSelection(block: EconomicBloc) {
    const isCurrentlySelected = this.isBlockSelected(block);
    
    if (isCurrentlySelected) {
      // Remove from selection
      this.selectedBlocks = this.selectedBlocks.filter(selectedBlock => selectedBlock.id !== block.id);
    } else {
      // Add to selection
      if (!this.selectedBlocks.some(selectedBlock => selectedBlock.id === block.id)) {
        this.selectedBlocks.push(block);
      }
    }
    this.updateDisplayValue();
    
    // Emit changes immediately for better responsiveness
    this.blocksSelected.emit(this.selectedBlocks);
  }

  /**
   * Updates the display value shown in the input field
   */
  updateDisplayValue() {
    this.displayValue = this.selectedBlocks.map(block => block.name).join(', ');
  }

  /**
   * Filters blocks based on search query
   */
  filterBlocks() {
    // Called on each input event; schedule debounced filtering instead of filtering synchronously.
    this.search$.next(this.searchQuery);
  }

  private applyFilter(rawQuery: string) {
    const q = normalizeSearchText(rawQuery);
    if (!q) {
      this.filteredBlocks = [...this.economicBlocks];
      return;
    }
    this.filteredBlocks = this.blocksIndex
      .filter((x) => x.normName.includes(q))
      .map((x) => x.block);
  }

  /**
   * Clears all selections
   */
  clearAllSelections() {
    this.selectedBlocks = [];
    this.updateDisplayValue();
    
    // Emit the cleared state
    this.blocksSelected.emit(this.selectedBlocks);
  }

  /**
   * Removes a specific block from selection
   */
  removeItem(itemName: string) {
    const block = this.economicBlocks.find(b => b.name === itemName);
    if (block) {
      this.selectedBlocks = this.selectedBlocks.filter(selectedBlock => selectedBlock.id !== block.id);
      this.updateDisplayValue();
      
      // Emit changes immediately after removal
      this.blocksSelected.emit(this.selectedBlocks);
    }
  }

  onConfirm() {
    if (this.selectedBlocks && this.selectedBlocks.length > 0) {
      this.blocksSelected.emit(this.selectedBlocks);
    }
    this.dialogVisible = false;
  }



  hasSelections(): boolean {
    return this.selectedBlocks && this.selectedBlocks.length > 0;
  }

  getSelectedDisplayItems(): string[] {
    return this.selectedBlocks.map(block => block.name);
  }
}