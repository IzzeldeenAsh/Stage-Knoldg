import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Knowledge } from 'src/app/_fake/services/knowledge/knowledge.service';

interface PackageData {
  packageName: string;
  knowledge_ids: number[];
  discount: number;
}

@Component({
  selector: 'app-package-builder-content',
  templateUrl: './package-builder-content.component.html',
  styleUrls: ['./package-builder-content.component.scss']
})
export class PackageBuilderContentComponent {
  @Input() packageName: string = '';
  @Input() packages: Knowledge[] = [];
  @Input() discount: number = 0;
  @Input() allKnowledges: Knowledge[] = [];
  @Input() selectedKnowledge: Knowledge | null = null;
  @Input() showDragDrop: boolean = true;
  @Input() draggedItem: Knowledge | null = null;
  @Input() loading: boolean = false;

  @Output() packageNameChange = new EventEmitter<string>();
  @Output() packagesChange = new EventEmitter<Knowledge[]>();
  @Output() discountChange = new EventEmitter<number>();
  @Output() selectedKnowledgeChange = new EventEmitter<Knowledge>();
  @Output() savePackage = new EventEmitter<PackageData>();

  // For the Metronic dropdown search:
  searchTerm: string = '';

  isSaving: boolean = false;

  get subtotal(): number {
    return this.packages.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
  }

  get totalPrice(): number {
    return this.subtotal * (1 - this.discount / 100);
  }

  filteredKnowledges(term: string): Knowledge[] {
    const lowerTerm = (term || '').toLowerCase();
    return this.allKnowledges.filter(
      kn => kn.title && kn.title.toLowerCase().includes(lowerTerm)
    );
  }

  updateDiscount(event: any) {
    const value = parseFloat(event.target.value);
    this.discount = isNaN(value) ? 0 : Math.min(Math.max(value, 0), 100);
    this.discountChange.emit(this.discount);
  }

  removePackageItem(item: Knowledge) {
    this.packages = this.packages.filter(pkg => pkg.id !== item.id);
    this.packagesChange.emit(this.packages);
  }

  onDragEnter(event: DragEvent) {
    if (this.showDragDrop) {
      event.preventDefault();
      this.draggedItem = {} as Knowledge;
    }
  }

  onDragLeave(event: DragEvent) {
    if (this.showDragDrop) {
      event.preventDefault();
      this.draggedItem = null;
    }
  }

  onDragOver(event: DragEvent) {
    if (this.showDragDrop) {
      event.preventDefault();
    }
  }

  onDrop(event: DragEvent) {
    if (!this.showDragDrop) return;
    
    event.preventDefault();
    this.draggedItem = null;
    
    if (event.dataTransfer) {
      const data = event.dataTransfer.getData('text');
      try {
        const item: Knowledge = JSON.parse(data);
        if (item && !this.packages.some(pkg => pkg.id === item.id)) {
          this.packages = [...this.packages, item];
          this.packagesChange.emit(this.packages);
        }
      } catch (e) {
        console.error('Error parsing dropped item:', e);
      }
    }
  }

  // When user selects one from the dropdown:
  onKnowledgeSelect(knowledge: Knowledge) {
    if (knowledge && !this.packages.some(pkg => pkg.id === knowledge.id)) {
      this.packages = [...this.packages, knowledge];
      this.packagesChange.emit(this.packages);
    }
    // Clear the selection & search if you wish
    this.selectedKnowledge = knowledge;
    this.selectedKnowledgeChange.emit(knowledge);
    this.searchTerm = '';
  }

  onSavePackage() {
    this.isSaving = true;
    const packageData: PackageData = {
      packageName: this.packageName.trim(),
      knowledge_ids: this.packages.map(pkg => pkg.id),
      discount: this.discount
    };
    this.savePackage.emit(packageData);
  }
} 