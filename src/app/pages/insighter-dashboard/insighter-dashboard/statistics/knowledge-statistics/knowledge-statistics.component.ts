import { Component, Injector, OnInit } from '@angular/core';
import { KnowledgeService, KnowledgeStatistics } from 'src/app/_fake/services/knowledge/knowledge.service';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-knowledge-statistics',
  templateUrl: './knowledge-statistics.component.html',
  styleUrl: './knowledge-statistics.component.scss'
})
export class KnowledgeStatisticsComponent extends BaseComponent implements OnInit {
  statistics: KnowledgeStatistics = {
    published: 0,
    scheduled: 0,
    draft: 0,
    total: 0
  };

  constructor(injector: Injector,private knowledgeService: KnowledgeService) {
    super(injector);
  }

  ngOnInit(): void {
    // this.loadStatistics();
  }

  private loadStatistics(): void {
    this.knowledgeService.getKnowledgeStatistics().subscribe({
      next: (stats) => {
        this.statistics = stats;
      },
      error: (error) => {
        console.error('Error loading knowledge statistics:', error);
      }
    });
  }
}
