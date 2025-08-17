import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { KnowledgeService, Knowledge } from 'src/app/_fake/services/knowledge/knowledge.service';

@Component({
  selector: 'app-knowledge-filter-chips',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './knowledge-filter-chips.component.html',
  styleUrls: ['./knowledge-filter-chips.component.scss']
})
export class KnowledgeFilterChipsComponent implements OnInit, OnChanges {
  @Input() selectedKnowledgeType: string = '';
  @Input() status?: string; // Filter knowledges by status (e.g., 'published', 'unpublished', 'scheduled')
  @Input() showChips: boolean = true; // Control whether to show chips
  @Output() typeFilter = new EventEmitter<string>();

  allKnowledges: Knowledge[] = [];
  typeCounts: { [key: string]: number } = {};

  constructor(private knowledgeService: KnowledgeService) {}

  ngOnInit(): void {
    this.loadAllKnowledges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reload when status changes
    if (changes['status'] && !changes['status'].firstChange) {
      this.loadAllKnowledges();
    }
  }

  loadAllKnowledges(): void {
    this.knowledgeService.getListKnowledge().subscribe(
      (response) => {
        // Filter by status if provided
        if (this.status) {
          this.allKnowledges = response.data.filter(k => k.status === this.status);
        } else {
          this.allKnowledges = response.data;
        }
        this.calculateTypeCounts();
      },
      (error) => {
        console.error('Error loading knowledges for filter chips:', error);
      }
    );
  }

  private calculateTypeCounts(): void {
    this.typeCounts = {};
    
    this.allKnowledges.forEach(knowledge => {
      if (knowledge.type) {
        if (!this.typeCounts[knowledge.type]) {
          this.typeCounts[knowledge.type] = 0;
        }
        this.typeCounts[knowledge.type]++;
      }
    });
  }

  getTypeCount(type: string): number {
    return this.typeCounts[type] || 0;
  }

  filterByType(type: string): void {
    this.selectedKnowledgeType = type;
    this.typeFilter.emit(type);
  }
}