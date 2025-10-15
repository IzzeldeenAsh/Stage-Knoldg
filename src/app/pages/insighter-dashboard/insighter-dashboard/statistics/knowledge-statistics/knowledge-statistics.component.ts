import { Component, Injector, OnInit } from '@angular/core';
import { KnowledgeService, KnowledgeStatistics } from 'src/app/_fake/services/knowledge/knowledge.service';
import { BaseComponent } from 'src/app/modules/base.component';
import { BreadcrumbItem, StatisticCard } from 'src/app/reusable-components/dashboard-statistics/dashboard-statistics.component';

@Component({
  selector: 'app-knowledge-statistics',
  templateUrl: './knowledge-statistics.component.html',
  styleUrl: './knowledge-statistics.component.scss'
})
export class KnowledgeStatisticsComponent extends BaseComponent implements OnInit {
  breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', translationKey: 'DASHBOARD' },
    { label: 'My Knowledge', translationKey: 'MY_KNOWLEDGE_BASE' }
  ];

  statisticCards: StatisticCard[] = [];

  statistics: KnowledgeStatistics = {
    published: 0,
    scheduled: 0,
    draft: 0,
    total: 0
  };

  constructor(injector: Injector, private knowledgeService: KnowledgeService) {
    super(injector);
  }

  ngOnInit(): void {
    // this.loadStatistics();
    this.initializeStatisticCards();
  }

  private initializeStatisticCards() {
    this.statisticCards = [
      {
        icon: 'ki-check-circle',
        iconType: 'ki-solid',
        iconColor: 'text-success',
        value: this.statistics.published,
        label: 'Posted Knowledge',
        translationKey: 'POSTED_KNOWLEDGE',
        useCountUp: true
      },
      {
        icon: 'ki-timer',
        iconType: 'ki-solid',
        iconColor: 'text-warning',
        value: this.statistics.scheduled,
        label: 'Scheduled Knowledge',
        translationKey: 'SCHEDULED_KNOWLEDGE',
        useCountUp: false
      },
      {
        icon: 'ki-abstract-26',
        iconType: 'ki-duotone',
        iconColor: 'text-danger',
        value: this.statistics.draft,
        label: 'Draft Knowledge',
        translationKey: 'DRAFT_KNOWLEDGE',
        useCountUp: false
      }
    ];
  }

  private loadStatistics(): void {
    this.knowledgeService.getKnowledgeStatistics().subscribe({
      next: (stats) => {
        this.statistics = stats;
        this.initializeStatisticCards();
      },
      error: (error) => {
        console.error('Error loading knowledge statistics:', error);
      }
    });
  }
}
