import { Component, OnInit, signal, computed, inject, DestroyRef, Injector, Inject, HostListener, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

import { BaseComponent } from 'src/app/modules/base.component';

import { Router, ActivatedRoute } from '@angular/router';

import { Document, KnowledgeItem, MyDownloadsService } from './my-downloads.service';
import { FileSizePipe } from 'src/app/pipes/file-size-pipe/file-size.pipe';


@Component({
  selector: 'app-my-downloads',
  templateUrl: './my-downloads.component.html',
  styleUrls: ['./my-downloads.component.scss']
})
export class MyDownloadsComponent extends BaseComponent implements OnInit, AfterViewInit {

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

  // Search state
  searchControl = new FormControl('');
  currentSearchTerm = signal<string>('');
  currentUuids = signal<string[]>([]);

  // UI state
  selectedColumn = signal<'knowledge' | 'document' | 'details'>('knowledge');

  // Archived downloads state
  showArchivedDownloads = signal<boolean>(false);
  archivedKnowledgeItems = signal<KnowledgeItem[]>([]);
  archivedCurrentPage = signal<number>(1);
  archivedTotalPages = signal<number>(1);
  archivedTotalItems = signal<number>(0);
  
  // Scroll state
  canScrollUp = signal<boolean>(false);
  canScrollDown = signal<boolean>(false);
  showScrollButton = computed(() => {
    const up = this.canScrollUp();
    const down = this.canScrollDown();
    
    // Priority: show down button when both are possible (user likely wants to see more content)
    // Only show up button when can't scroll down anymore
    if (down) return 'down';
    if (up) return 'up';
    return null;
  });
  
  @ViewChild('knowledgeList', { static: false }) knowledgeListElement!: ElementRef;
  
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

  // Get current knowledge items based on archive state
  currentKnowledgeItems = computed(() => {
    return this.showArchivedDownloads() ? this.archivedKnowledgeItems() : this.knowledgeItems();
  });

  // Get current pagination based on archive state
  currentDisplayPage = computed(() => {
    return this.showArchivedDownloads() ? this.archivedCurrentPage() : this.currentPage();
  });

  currentDisplayTotalPages = computed(() => {
    return this.showArchivedDownloads() ? this.archivedTotalPages() : this.totalPages();
  });

  currentDisplayTotalItems = computed(() => {
    return this.showArchivedDownloads() ? this.archivedTotalItems() : this.totalItems();
  });

  hasNextPage = computed(() => this.currentDisplayPage() < this.currentDisplayTotalPages());
  hasPrevPage = computed(() => this.currentDisplayPage() > 1);
  
  //Services
  private myDownloadsService = inject(MyDownloadsService);
  private destroyRef = inject(DestroyRef);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private elementRef = inject(ElementRef);

  Math = Math;

  constructor(
    injector:Injector,
    private _mydownloads:MyDownloadsService,
  ) {
    super(injector)
   }
  ngOnInit(): void {
    // Check for search query param first
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        if (params['search']) {
          this.searchControl.setValue(params['search'], { emitEvent: false });
          this.currentSearchTerm.set(params['search']);
          this.currentUuids.set([]);
          this.loadMyDownloads(1, params['search']);
        } else if (params['uuids']) {
          // Handle multiple UUIDs passed as comma-separated string
          const uuids = params['uuids'].split(',').filter((id: string) => id.trim());
          this.currentUuids.set(uuids);
          this.currentSearchTerm.set('');
          this.searchControl.setValue('', { emitEvent: false });
          this.loadMyDownloads(1, '', uuids);
        } else if (params['uuid']) {
          const uuids = [params['uuid']];
          this.currentUuids.set(uuids);
          this.currentSearchTerm.set('');
          this.searchControl.setValue('', { emitEvent: false });
          this.loadMyDownloads(1, '', uuids);
        } else {
          this.loadMyDownloads();
        }
      });

    //loading states
    this._mydownloads.isLoading$
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(loading => this.loading.set(loading));

    // Setup search with debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(500), // Wait 500ms after user stops typing
        distinctUntilChanged(), // Only trigger if value actually changed
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(searchTerm => {
        this.currentSearchTerm.set(searchTerm || '');
        this.currentUuids.set([]); // Clear UUIDs when searching by title
        this.currentPage.set(1); // Reset to first page when searching
        this.selectedKnowledge.set(null); // Clear selection when searching
        this.selectedDocument.set(null);

        // Reset archived state when searching
        if (this.showArchivedDownloads()) {
          this.showArchivedDownloads.set(false);
        }

        this.loadMyDownloads(1, searchTerm || '', []);
      });
   
  }

  ngAfterViewInit(): void {
    // Check scroll state after view initializes
    setTimeout(() => {
      this.checkScrollState();
    }, 100);
  }

  loadMyDownloads(page: number = 1, searchTerm: string = '', uuids: string[] = []): void {
    this._mydownloads.getMyDownloads(page, searchTerm || undefined, uuids.length > 0 ? uuids : undefined)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe({
      next:(response) =>{
        this.knowledgeItems.set(response.data);
        this.currentPage.set(response.meta.current_page);
        this.totalPages.set(response.meta.last_page);
        this.totalItems.set(response.meta.total);
        this.perPage.set(response.meta.per_page);

        // Auto-select first item if search term is provided and matches
        if (searchTerm && response.data.length > 0 && !this.selectedKnowledge()) {
          this.selectedKnowledge.set(response.data[0]);
        }
        
        // Auto-select first item if UUIDs are provided
        if (uuids && uuids.length > 0 && response.data.length > 0 && !this.selectedKnowledge()) {
          this.selectedKnowledge.set(response.data[0]);
        }
        
        // Check scroll state after data loads
        setTimeout(() => {
          this.checkScrollState();
        }, 100);
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
      if (page >= 1 && page <= this.currentDisplayTotalPages() && page !== this.currentDisplayPage()) {
        if (this.showArchivedDownloads()) {
          this.loadArchivedDownloads(page);
        } else {
          this.loadMyDownloads(page, this.currentSearchTerm(), this.currentUuids());
        }
      }
    }


  getPages(): (number | string)[] {
    const totalPages = this.currentDisplayTotalPages();
    const currentPage = this.currentDisplayPage();
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

  clearSearch(): void {
    this.searchControl.setValue('');
  }

  viewAll(): void {
    // Clear UUIDs and search term
    this.currentUuids.set([]);
    this.currentSearchTerm.set('');
    this.searchControl.setValue('', { emitEvent: false });
    
    // Reset page to 1 and clear selections
    this.currentPage.set(1);
    this.selectedKnowledge.set(null);
    this.selectedDocument.set(null);
    
    // Load all downloads without filters
    this.loadMyDownloads(1, '', []);
    
    // Update URL to remove query parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      queryParamsHandling: 'merge'
    });
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

  getFileIconByExtension(fileExtension: string): string {
    const iconMap: { [key: string]: string } = {
      pdf: './assets/media/svg/new-files/pdf.svg',
      doc: './assets/media/svg/new-files/doc.svg',
      docx: './assets/media/svg/new-files/docx.svg',
      xls: './assets/media/svg/new-files/xls.svg',
      ppt: './assets/media/svg/new-files/ppt.svg',
      pptx: './assets/media/svg/new-files/pptx.svg',
      txt: './assets/media/svg/new-files/txt.svg',
      zip: './assets/media/svg/new-files/zip.svg',
      xlsx: './assets/media/svg/new-files/xlsx.svg',
      default: './assets/media/svg/new-files/default.svg',
    };
    const ext = fileExtension?.toLowerCase() || '';
    return iconMap[ext] || iconMap.default;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as Element;
    const componentElement = this.elementRef.nativeElement;
    
    // Check if the click was outside the component
    if (!componentElement.contains(target)) {
      this.resetKnowledgeSelection();
    }
  }

  private resetKnowledgeSelection(): void {
    this.selectedKnowledge.set(null);
    this.selectedDocument.set(null);
  }

  onKnowledgeColumnClick(): void {
    // Reset knowledge selection when clicking anywhere in the knowledge column
    // except on knowledge items (which have stopPropagation)
    this.resetKnowledgeSelection();
  }

  checkScrollState(): void {
    if (!this.knowledgeListElement) return;
    
    const element = this.knowledgeListElement.nativeElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    
    // Add buffer to prevent flickering near boundaries
    const buffer = 5;
    
    this.canScrollUp.set(scrollTop > buffer);
    this.canScrollDown.set(scrollTop < scrollHeight - clientHeight - buffer);
  }

  scrollUp(): void {
    if (!this.knowledgeListElement) return;
    
    const element = this.knowledgeListElement.nativeElement;
    element.scrollBy({
      top: -100,
      behavior: 'smooth'
    });
    
    setTimeout(() => this.checkScrollState(), 300);
  }

  scrollDown(): void {
    if (!this.knowledgeListElement) return;
    
    const element = this.knowledgeListElement.nativeElement;
    element.scrollBy({
      top: 100,
      behavior: 'smooth'
    });
    
    setTimeout(() => this.checkScrollState(), 300);
  }

  onKnowledgeListScroll(): void {
    this.checkScrollState();
  }

  // Archive functionality
  archiveKnowledge(knowledge: KnowledgeItem): void {
    // Add knowledge UUID to downloading items to show loading state
    this.downloadingItems.update(items => new Set(items).add(knowledge.uuid));

    this.myDownloadsService.archiveKnowledge(knowledge.uuid)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.showSuccess('Success', 'Knowledge archived successfully');
          // Remove from downloading items
          this.downloadingItems.update(items => {
            const newItems = new Set(items);
            newItems.delete(knowledge.uuid);
            return newItems;
          });

          // Unselect the knowledge if it was selected
          if (this.selectedKnowledge()?.uuid === knowledge.uuid) {
            this.selectedKnowledge.set(null);
            this.selectedDocument.set(null);
          }

          // Reload current downloads
          this.reloadCurrentDownloads();
        },
        error: (error) => {
          console.error('Error archiving knowledge:', error);
          this.showError('Error', 'Failed to archive knowledge. Please try again.');
          // Remove from downloading items
          this.downloadingItems.update(items => {
            const newItems = new Set(items);
            newItems.delete(knowledge.uuid);
            return newItems;
          });
        }
      });
  }

  // Toggle between regular downloads and archived downloads
  toggleArchivedDownloads(): void {
    const newState = !this.showArchivedDownloads();
    this.showArchivedDownloads.set(newState);

    // Clear selections when toggling
    this.selectedKnowledge.set(null);
    this.selectedDocument.set(null);

    if (newState) {
      this.loadArchivedDownloads(1);
    } else {
      this.loadMyDownloads(1, this.currentSearchTerm(), this.currentUuids());
    }
  }

  // Load archived downloads
  loadArchivedDownloads(page: number = 1): void {
    this.myDownloadsService.getArchivedDownloads(page, this.currentSearchTerm() || undefined, this.currentUuids().length > 0 ? this.currentUuids() : undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.archivedKnowledgeItems.set(response.data);
          this.archivedCurrentPage.set(response.meta.current_page);
          this.archivedTotalPages.set(response.meta.last_page);
          this.archivedTotalItems.set(response.meta.total);

          // Check scroll state after data loads
          setTimeout(() => {
            this.checkScrollState();
          }, 100);
        },
        error: (error) => {
          console.error('Error loading archived downloads:', error);
          this.showError('Error', 'Failed to load archived downloads. Please try again.');
        }
      });
  }

  // Helper method to reload current downloads based on state
  private reloadCurrentDownloads(): void {
    if (this.showArchivedDownloads()) {
      this.loadArchivedDownloads(this.currentDisplayPage());
    } else {
      this.loadMyDownloads(this.currentDisplayPage(), this.currentSearchTerm(), this.currentUuids());
    }
  }

} 