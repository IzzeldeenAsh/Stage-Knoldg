import { Component, OnInit, HostListener, Injector } from '@angular/core';
import { KnowledgeService, Knowledge } from 'src/app/_fake/services/knowledge/knowledge.service';
import { KnowldegePackegesService } from 'src/app/_fake/services/knowldege-packages/knowldege-packeges.service';
import { PageEvent } from '@angular/material/paginator';
import { trigger, state, style, animate, transition } from '@angular/animations';
import Swal from 'sweetalert2';
import { switchMap } from 'rxjs';
import { BaseComponent } from 'src/app/modules/base.component';
import { DialogService } from 'primeng/dynamicdialog';
import { ScheduleDialogComponent } from '../packages/schedule-dialog/schedule-dialog.component';

interface PackageData {
  packageName: string;
  knowledge_ids: number[];
  discount: number;
}

@Component({
  selector: 'app-general',
  templateUrl: './general.component.html',
  styleUrls: ['./general.component.scss'],
  providers: [DialogService],
  animations: [
    trigger('slideInOut', [
      state('void', style({
        transform: 'translateX(100%)',
        opacity: 0
      })),
      state('*', style({
        transform: 'translateX(0)',
        opacity: 1
      })),
      transition(':enter', [
        animate('300ms ease-out')
      ]),
      transition(':leave', [
        animate('300ms ease-in')
      ]),
      transition(':enter', [
        animate('300ms ease-out', style({
          transform: 'translateY(100%)',
          opacity: 0
        }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({
          transform: 'translateY(0)',
          opacity: 1
        }))
      ])
    ]),
    trigger('columnResize', [
      transition('* => *', [
        animate('300ms ease-out')
      ])
    ])
  ]
})
export class GeneralComponent extends BaseComponent implements OnInit {
  knowledges: Knowledge[] = [];
  packages: Knowledge[] = [];
  showPackageBuilder = false;
  showDialog = false;
  isSmallScreen = false;
  discount: number = 0;
  packageName: string = '';

  // Pagination variables
  currentPage: number = 1;
  totalItems: number = 0;
  itemsPerPage: number = 10;

  draggedItem: Knowledge | null = null;
  allKnowledges: Knowledge[] = [];
  selectedKnowledge: Knowledge | null = null;

  // Add loading property
  loading: boolean = false;

  selectedKnowledges: Set<number> = new Set();
  allSelected: boolean = false;

  // Add these properties
  searchTerm: string = '';
  searchTimeout: any;

  constructor(
    injector: Injector,
    private knowledgeService: KnowledgeService,
    private knowldegePackegesService: KnowldegePackegesService,
    private dialogService: DialogService
  ) {
    super(injector);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  ngOnInit() {
    this.loadKnowledges(this.currentPage);
    this.loadAllKnowledges();
    this.checkScreenSize();
  }

  private checkScreenSize() {
    this.isSmallScreen = window.innerWidth < 1040;
    if (this.isSmallScreen && this.showPackageBuilder) {
      this.showDialog = true;
      this.showPackageBuilder = false;
    }
  }

  get totalPrice(): number {
    const subtotal = this.packages.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
    return subtotal * (1 - this.discount / 100);
  }

  get subtotal(): number {
    return this.packages.reduce((sum, item) => sum + parseFloat(item.total_price), 0);
  }

  toggleSelectAll() {
    this.allSelected = !this.allSelected;
    if (this.allSelected) {
      this.knowledges.forEach(knowledge => this.selectedKnowledges.add(knowledge.id));
    } else {
      this.selectedKnowledges.clear();
    }
  }

  toggleSelect(id: number) {
    if (this.selectedKnowledges.has(id)) {
      this.selectedKnowledges.delete(id);
      this.allSelected = false;
    } else {
      this.selectedKnowledges.add(id);
      this.allSelected = this.knowledges.every(k => this.selectedKnowledges.has(k.id));
    }
  }

  isSelected(id: number): boolean {
    return this.selectedKnowledges.has(id);
  }

  deleteSelectedKnowledges() {
    if (this.selectedKnowledges.size === 0) return;

    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete them!'
    }).then((result) => {
      if (result.isConfirmed) {
        const deletePromises = Array.from(this.selectedKnowledges).map(id =>
          this.knowledgeService.deleteKnowledge(id).toPromise()
        );

        Promise.all(deletePromises)
          .then(() => {
            // Remove deleted items from packages
            this.packages = this.packages.filter(pkg => !this.selectedKnowledges.has(pkg.id));
            // Remove deleted items from knowledges list
            this.knowledges = this.knowledges.filter(k => !this.selectedKnowledges.has(k.id));
            // Update total items count
            this.totalItems -= this.selectedKnowledges.size;
            // Clear selection
            this.selectedKnowledges.clear();
            this.allSelected = false;
            
            this.showSuccess('Selected knowledges have been deleted.', 'success');
          })
          .catch((error) => {
            console.error('Error deleting knowledges:', error);
            const errorMessage = error.error?.message || error.error?.errors?.common?.[0] || 'There was an error deleting the knowledges.';
            Swal.fire(
              'Error!',
              errorMessage,
              'error'
            );
          });
      }
    });
  }

  loadKnowledges(page: number) {
    this.knowledgeService.getPaginatedKnowledges(page, undefined, this.searchTerm).subscribe(
      (response) => {
        this.knowledges = response.data;
        this.totalItems = response.meta.total;
        this.currentPage = response.meta.current_page;
        this.selectedKnowledges.clear();
        this.allSelected = false;
      },
      (error) => {
        console.error('Error fetching knowledges:', error);
      }
    );
  }

  onPageChange(event: PageEvent) {
    this.itemsPerPage = event.pageSize;
    this.currentPage = event.pageIndex + 1;
    this.loadKnowledges(this.currentPage);
  }

  onDragStart(event: DragEvent, item: Knowledge) {
    if (event.dataTransfer) {
      this.draggedItem = item;
      event.dataTransfer.setData('text', JSON.stringify(item));
    }
  }

  onDragEnd(event: DragEvent) {
    this.draggedItem = null;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault(); // This is crucial!
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      const data = event.dataTransfer.getData('text');
      try {
        const item: Knowledge = JSON.parse(data);
        if (item && !this.packages.some(pkg => pkg.id === item.id)) {
          this.packages = [...this.packages, item];
          console.log('Updated packages:', this.packages);
        }
      } catch (e) {
        console.error('Error parsing dropped item:', e);
      }
    }
  }

  togglePackageBuilder() {
    if (this.isSmallScreen) {
      this.showDialog = !this.showDialog;
      if (!this.showDialog) {
        this.resetPackageBuilder();
      }
    } else {
      this.showPackageBuilder = !this.showPackageBuilder;
      if (!this.showPackageBuilder) {
        this.resetPackageBuilder();
      }
    }
  }

  private resetPackageBuilder() {
    this.packages = [];
    this.discount = 0;
    this.packageName = '';
  }

  hideDialog() {
    this.showDialog = false;
    this.resetPackageBuilder();
  }

  updateDiscount(event: any) {
    const value = parseFloat(event.target.value);
    this.discount = isNaN(value) ? 0 : Math.min(Math.max(value, 0), 100);
  }

  removePackageItem(item: Knowledge) {
    this.packages = this.packages.filter(pkg => pkg.id !== item.id);
  }

  savePackage(packageData: PackageData) {
    if (!packageData.packageName.trim()) {
      Swal.fire({
        title: 'Error',
        text: 'Package name is required',
        icon: 'error'
      });
      this.loading = false;
      return;
    }

    if (packageData.knowledge_ids.length === 0) {
      Swal.fire({
        title: 'Error',
        text: 'Please add at least one knowledge to the package',
        icon: 'error'
      });
      this.loading = false;
      return;
    }

    this.loading = true;
    this.handleAPIPackage(packageData);
  }

  handleAPIPackage(packageData: PackageData) {
    this.knowldegePackegesService.createPackage(packageData.packageName.trim()).pipe(
      switchMap((response: any) => {
        const libraryPackageId = response.data.library_package_id;
        return this.knowldegePackegesService.syncPackageKnowledge(
          libraryPackageId,
          packageData.knowledge_ids,
          packageData.discount
        );
      })
    ).subscribe(
      () => {
        Swal.fire({
          title: 'Success',
          text: 'Package saved successfully',
          icon: 'success'
        }).then(() => {
          this.togglePackageBuilder();
        });
      },
      (error) => {
        console.error('Error saving package:', error);
        Swal.fire({
          title: 'Error',
          text: error.error?.message || 'Failed to save package',
          icon: 'error'
        });
      }
    ).add(() => {
      this.loading = false;
    });
  }

  showEmittedPackage(packageData: PackageData) {
    this.savePackage(packageData);
  }

  cancelPackage() {
    this.packages = [];
  }

  loadPage(page: number) {
    this.currentPage = page;
    this.loadKnowledges(page);
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  getPages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  deleteKnowledge(knowledge: Knowledge) {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.knowledgeService.deleteKnowledge(knowledge.id).subscribe(
          () => {
            // Remove from packages if exists
            this.packages = this.packages.filter(pkg => pkg.id !== knowledge.id);
            // Remove from knowledges list
            this.knowledges = this.knowledges.filter(k => k.id !== knowledge.id);
            // Update total items count
            this.totalItems--;
            
            this.showSuccess('Knowledge has been deleted.', 'success');
          },
          (error) => {
            console.error('Error deleting knowledge:', error);
            const errorMessage = error.error?.message || error.error?.errors?.common?.[0] || 'There was an error deleting the knowledge.';
            Swal.fire(
              'Error!',
              errorMessage,
              'error'
            );
          }
        );
      }
    });
  }

  loadAllKnowledges() {
    this.knowledgeService.getListKnowledge().subscribe(
      (response) => {
        this.allKnowledges = response.data;
      },
      (error) => {
        console.error('Error fetching all knowledges:', error);
      }
    );
  }

  onKnowledgeSelect(event: any) {
    if (event && !this.packages.some(pkg => pkg.id === event.id)) {
      this.packages = [...this.packages, event];
      this.selectedKnowledge = null;
    }
  }

  updateStatus(knowledgeId: number, status: string) {
    if (status === 'scheduled') {
      this.openScheduleDialog(knowledgeId);
    } else {
      this.setKnowledgeStatus(knowledgeId, status, new Date().toISOString());
    }
  }

  openScheduleDialog(knowledgeId: number) {
    const dialogRef = this.dialogService.open(ScheduleDialogComponent, {
      header: 'Schedule Publication',
      width: '400px'
    });

    dialogRef.onClose.subscribe((dateTime: string | null) => {
      if (dateTime) {
        this.setKnowledgeStatus(knowledgeId, 'scheduled', dateTime);
      }
    });
  }

  setKnowledgeStatus(knowledgeId: number, status: string, publishedAt: string) {
    this.knowledgeService.setKnowledgeStatus(knowledgeId, status, publishedAt).subscribe(
      () => {
        // Update the knowledge status in the local array
        const knowledge = this.knowledges.find(k => k.id === knowledgeId);
        if (knowledge) {
          knowledge.status = status;
        }
        this.showSuccess('Status updated successfully', 'success');
      },
      (error:any) => {
        console.error('Error updating status:', error);
        const errorMessage = error.error?.message || error.error?.errors?.common?.[0] || 'There was an error updating the status.';
        Swal.fire(
          'Error!',
          errorMessage,
          'error'
        );
      }
    );
  }

  // Add this method to handle search
  onSearch(event: any) {
    const value = event.target.value;
    this.searchTerm = value;
    
    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Set new timeout for debouncing
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1; // Reset to first page when searching
      this.loadKnowledges(this.currentPage);
    }, 300); // 300ms debounce
  }

  // Add this method to handle status classes
  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'published':
        return 'badge badge-light-success';
      case 'unpublished':
        return 'badge badge-light-danger';
      case 'scheduled':
        return 'badge badge-light-warning';
      default:
        return 'badge badge-light-info';
    }
  }
}