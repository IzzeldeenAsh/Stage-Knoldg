import { Component, inject, Injector, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BaseComponent } from 'src/app/modules/base.component';
import { MyDownloadsService, KnowledgeItem } from '../../my-downloads/my-downloads.service';

@Component({
  selector: 'app-downloads-statistics',
  templateUrl: './downloads-statistics.component.html',
  styleUrls: ['./downloads-statistics.component.scss']
})
export class DownloadsStatisticsComponent extends BaseComponent implements OnInit {

  // Signals
  allKnowledgeItems = signal<KnowledgeItem[]>([]);
  loading = signal<boolean>(false);

  // Computed statistics
  totalRevenue = computed(() => {
    return this.allKnowledgeItems().reduce((total, knowledge) => {
      return total + knowledge.documents.reduce((docTotal, doc) => docTotal + doc.price, 0);
    }, 0);
  });

  totalPurchases = computed(() => {
    return this.allKnowledgeItems().reduce((total, knowledge) => {
      return total + knowledge.documents.length;
    }, 0);
  });

  totalPublishedKnowledge = computed(() => {
    return this.allKnowledgeItems().length;
  });

  // Services
  private myDownloadsService = inject(MyDownloadsService);
  private destroyRef = inject(DestroyRef);

  constructor(injector: Injector) { 
    super(injector);
  }

  ngOnInit(): void {
    this.loadAllDownloadStatistics();
  }

  private loadAllDownloadStatistics(): void {
    this.loading.set(true);
    this.loadAllPages();
  }

  private loadAllPages(page: number = 1, allItems: KnowledgeItem[] = []): void {
    this.myDownloadsService.getMyDownloads(page)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const newItems = [...allItems, ...response.data];
          
          // If there are more pages, continue loading
          if (page < response.meta.last_page) {
            this.loadAllPages(page + 1, newItems);
          } else {
            // All pages loaded, update signal
            this.allKnowledgeItems.set(newItems);
            this.loading.set(false);
          }
        },
        error: (error) => {
          console.error('Error loading download statistics:', error);
          this.showError('Error', 'Failed to load statistics. Please try again.');
          this.loading.set(false);
        }
      });
  }
} 