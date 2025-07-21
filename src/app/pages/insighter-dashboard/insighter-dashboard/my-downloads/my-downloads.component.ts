import { Component, OnInit, signal, computed, inject, DestroyRef, Injector, Inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { BaseComponent } from 'src/app/modules/base.component';

import { Router } from '@angular/router';

import { Document, KnowledgeItem, MyDownloadsService } from './my-downloads.service';


@Component({
  selector: 'app-my-downloads',
  templateUrl: './my-downloads.component.html',
  styleUrls: ['./my-downloads.component.scss']
})
export class MyDownloadsComponent extends BaseComponent implements OnInit {

  //Signals
  knowledgeItems = signal<KnowledgeItem[]>([]);
  selectedKnowledge = signal<KnowledgeItem | null >(null);
  selectedDocument = signal<Document| null> (null);
  loading = signal<boolean>(false);
  // Replace single downloadLoading signal with Set to track individual item loading
  downloadingItems = signal<Set<string>>(new Set());

  //Pagination Signals
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  totalItems = signal<number>(0);
  perPage = signal<number>(15);

  // UI state
  selectedColumn = signal<'knowledge' | 'document' | 'details'>('knowledge');
  
  //Computed Properties
  currentKnowledgeDocuments = computed(()=>{
    const knowledge = this.selectedKnowledge();
    return knowledge?.documents || []
  });

  currentKnowledgeDetails = computed (()=>{
    const knowledge = this.selectedKnowledge();
    if(!knowledge) return null
    return {
      type:knowledge.type,
      publisher:knowledge.insighter,
      purchaseDate: knowledge.purchase_date,
      slug:knowledge.knowledge_slug
    }
  })

  hasNextPage = computed(() => this.currentPage() < this.totalPages());
  hasPrevPage = computed(() => this.currentPage() > 1);
  
  //Services
  private myDownloadsService = inject(MyDownloadsService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);

  Math = Math;

  constructor(
    injector:Injector,
    private _mydownloads:MyDownloadsService,
  ) {
    super(injector)
   }
  ngOnInit(): void {
    this.loadMyDownloads();

    //loading states
    this._mydownloads.isLoading$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(loading => this.loading.set(loading));
   
  }

  loadMyDownloads(page:number =1):void{
    this._mydownloads.getMyDownloads(page)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next:(response) =>{
        this.knowledgeItems.set(response.data);
        this.currentPage.set(response.meta.current_page);
        this.totalPages.set(response.meta.last_page);
        this.totalItems.set(response.meta.total);
        this.perPage.set(response.meta.per_page);

        //Auto-Select first item if available
        if(response.data.length>0 && !this.selectedKnowledge()){
          this.selectedKnowledge.set(response.data[0])
        }
      },
      error: (error)=>{
        console.error('Error loading downloads:', error);
        this.showError('Error', 'Failed to load downloads. Please try again.');
      }
    })
  }

  selectKnowledge(knowledge:KnowledgeItem):void{
    this.selectedKnowledge.set(knowledge);
    this.selectedDocument.set(null);
    this.selectedColumn.set('document');
  }

  selectDocument(document:Document):void{
    this.selectedDocument.set(document);
    this.selectedColumn.set('details');
  }

  downloadKnowledge(knowledge: KnowledgeItem): void {
    // Add knowledge UUID to downloading items
    this.downloadingItems.update(items => new Set(items).add(knowledge.uuid));
    
    this.myDownloadsService.downloadKnowledge(knowledge.uuid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (blob) => {
          this.downloadFile(blob, `${knowledge.title}.zip`);
          // Remove knowledge UUID from downloading items
          this.downloadingItems.update(items => {
            const newItems = new Set(items);
            newItems.delete(knowledge.uuid);
            return newItems;
          });
        },
        error: (error) => {
          console.error('Error downloading knowledge:', error);
          this.showError('Error', 'Failed to download knowledge. Please try again.');
          // Remove knowledge UUID from downloading items
          this.downloadingItems.update(items => {
            const newItems = new Set(items);
            newItems.delete(knowledge.uuid);
            return newItems;
          });
        }
      });
  }

  downloadDocument(document: Document): void {
    // Add document UUID to downloading items
    this.downloadingItems.update(items => new Set(items).add(document.uuid));
    
    this.myDownloadsService.downloadDocument(document.uuid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          // Open the URL in a new tab to download the file
          window.open(response.url, '_blank');
          // Remove document UUID from downloading items
          this.downloadingItems.update(items => {
            const newItems = new Set(items);
            newItems.delete(document.uuid);
            return newItems;
          });
        },
        error: (error) => {
          console.error('Error downloading document:', error);
          this.showError('Error', 'Failed to download document. Please try again.');
          // Remove document UUID from downloading items
          this.downloadingItems.update(items => {
            const newItems = new Set(items);
            newItems.delete(document.uuid);
            return newItems;
          });
        }
      });
  }

  // Helper methods to check loading state for specific items
  isKnowledgeDownloading(knowledgeUuid: string): boolean {
    return this.downloadingItems().has(knowledgeUuid);
  }

  isDocumentDownloading(documentUuid: string): boolean {
    return this.downloadingItems().has(documentUuid);
  }

  private downloadFile(blob:Blob, filename:string):void{
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url)
  }

  viewKnowledge(knowledge: KnowledgeItem): void {
    const url = `${this.clientBaseUrl}/${this.lang}/knowledge/${knowledge.type}/${knowledge.knowledge_slug}`;
    window.open(url, '_blank');
  }

    // Pagination methods
    onPageChange(page: number): void {
      if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
        this.loadMyDownloads(page);
      }
    }


  getPages(): (number | string)[] {
    const totalPages = this.totalPages();
    const currentPage = this.currentPage();
    const delta = 2;
    let pages: (number | string)[] = [];

    const left = Math.max(2, currentPage - delta);
    const right = Math.min(totalPages - 1, currentPage + delta);

    pages.push(1);

    if (left > 2) {
      pages.push('...');
    }

    for (let i = left; i <= right; i++) {
      pages.push(i);
    }

    if (right < totalPages - 1) {
      pages.push('...');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  }
 

  onPageClick(page: number | string): void {
    if (typeof page === 'number') {
      this.onPageChange(page);
    }
  }

  trackByKnowledgeUuid(index: number, item: KnowledgeItem): string {
    return item.uuid;
  }

  trackByDocumentUuid(index: number, item: Document): string {
    return item.uuid;
  }

  trackByPageIndex(index: number, item: number | string): number | string {
    return item;
  }

} 