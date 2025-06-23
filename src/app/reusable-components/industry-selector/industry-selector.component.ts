import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  Observable,
  Subscription,
  BehaviorSubject,
  fromEvent,
  map,
  startWith,
} from "rxjs";
import { DialogModule } from "primeng/dialog";
import { FormsModule } from "@angular/forms";
import { InputTextModule } from "primeng/inputtext";
import { TreeNode } from "primeng/api";
import { NgbTooltipModule } from "@ng-bootstrap/ng-bootstrap";
import { TranslationModule } from "src/app/modules/i18n";

interface FlatNode {
  key: number;
  code?: string;
  label: string;
  fullPath: string;
  originalNode: TreeNode;
}

@Component({
  selector: "app-industry-selector",
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    FormsModule,
    InputTextModule,
    NgbTooltipModule,
    TranslationModule
  ],
  template: `
    <p-dialog
      [header]="title"
      [(visible)]="dialogVisible"
      [modal]="true"
      [style]="{ width: dialogWidth, 'max-height': '100vh', overflow: 'hidden' }"
      [contentStyle]="{ 'max-height': 'calc(90vh - 100px)', overflow: 'auto' }"
      appendTo="body"
    >
      <div class="list-container">
        <!-- Search Input -->
        <div class="search-container mb-3">
          <input
            type="text"
            pInputText
            class="w-100"
            placeholder="Search..."
            [(ngModel)]="searchText"
            (input)="filterNodes()"
          />
        </div>
        
        <!-- Loading indicator -->
        <div *ngIf="isLoading$ | async" class="text-center p-4">
          <i class="pi pi-spinner pi-spin"></i>
          <div>Loading...</div>
        </div>
        
        <!-- List Items -->
        <div *ngIf="!(isLoading$ | async)" class="list-items">
          <div 
            *ngFor="let option of filteredNodes; trackBy: trackByKey" 
            class="list-item cursor-pointer"
            [class.selected]="option.key === selectedFlatNode?.key"
            (click)="selectItem(option)"
          >
            <div class="d-flex align-items-start">
              <span *ngIf="showCode && option.code" class="fw-bold text-primary me-2 flex-shrink-0">[{{option.code}}]</span>
              <div class="flex-grow-1">
                <div class="fw-semibold">{{option.label}}</div>
                <small class="text-muted">{{option.fullPath}}</small>
              </div>
              <i *ngIf="option.key === selectedFlatNode?.key" class="fas fa-check text-success ms-2"></i>
            </div>
          </div>
          
          <!-- No results message -->
          <div *ngIf="filteredNodes.length === 0" class="text-center p-4 text-muted">
            <i class="fas fa-search mb-2"></i>
            <div>No results found</div>
          </div>
        </div>
      </div>
      <p-footer>
        <div class="p-2 d-flex justify-content-between align-items-center">
          <a
            class="btn btn-sm btn-secondary btn-shadow cursor-pointer"
            (click)="onCancel()"
          >
            {{ cancelLabel }}
          </a>
          <a
            class="btn btn-sm btn-primary m-1 btn-shadow cursor-pointer"
            (click)="onOk()"
            [class.disabled]="!isValidSelection()"
          >
            {{ okLabel }}
          </a>
        </div>
      </p-footer>
    </p-dialog>

    <div class="w-100">
      <div class="d-flex align-items-center">
        <label class="d-flex align-items-center form-label mb-3" [ngClass]="{'required': isRequired}">
          {{ title }}
          <i
            class="fas fa-exclamation-circle mx-2 fs-7"
            ngbTooltip="{{tip}}">
          </i>
          <span class="text-muted fs-8 mx-2" *ngIf="!isRequired"> ({{'OPTIONAL' | translate}}) </span>
        </label>
        <span *ngIf="isAiGenerated" class="ai-generated-badge ms-2 mb-2">
          AI Generated
        </span>
      </div>
      <div class="position-relative">
        <input
          type="text"
          pInputText
          class="w-100"
          [readonly]="true"
          [placeholder]="placeholder"
          (click)="showDialog()"
          [value]="selectedNodeLabel()"
          [ngClass]="{'is-invalid': isRequired && !selectedNode}"
        />
        <!-- Clear icon -->
        <i 
          *ngIf="selectedFlatNode" 
          class="fas fa-times clear-icon position-absolute"
          (click)="clearSelection($event)"
          title="Clear selection"
        ></i>
      </div>
    </div>
  `,
  styles: [`
    .responsive-dialog {
      width: 50vw;
      max-height: 90vh;
      overflow: hidden;
    }
    
    @media (max-width: 768px) {
      .responsive-dialog {
        width: 100vw;
      }
    }
    
    .list-container {
      min-height: 400px;
      max-height: calc(80vh - 100px);
    }
    
    .search-container {
      position: sticky;
      top: 0;
      background: white;
      z-index: 10;
      padding-bottom: 10px;
      border-bottom: 1px solid #e9ecef;
    }
    
    .list-items {
      max-height: calc(80vh - 180px);
      overflow-y: auto;
    }
    
    .list-item {
      padding: 12px;
      border-bottom: 1px solid #f1f1f1;
      transition: all 0.2s ease;
    }
    
    .list-item:hover {
      background-color: #f8f9fa;
    }
    
    .list-item.selected {
      background-color: #e3f2fd;
      border-left: 4px solid #2196f3;
    }
    
    .list-item:last-child {
      border-bottom: none;
    }
    
    .max-width-200px {
      max-width: 250px;
      width: 250px;
    }
    
    .logo-placeholder {
      background-size: contain;
      background-position: center;
    }
    
    .fit-content {
      width: fit-content;
    }
    
    .mb-3 {
      transition: all 300ms ease-in-out;
    } 
    
    .ai-generated-badge {
      font-size: 0.75rem;
      padding: 2px 8px;
      background: linear-gradient(135deg, rgba(255,209,0,0.1) 0%, rgba(255,145,0,0.1) 100%);
      color: #FF9900;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      font-weight: 500;
      border: 1px solid rgba(255,153,0,0.3);
      animation: glow 1.5s ease-in-out infinite alternate;
    }
    
    @keyframes glow {
      from {
        box-shadow: 0 0 0px rgba(255,153,0,0);
      }
      to {
        box-shadow: 0 0 3px rgba(255,153,0,0.5);
      }
    }
    
    .clear-icon {
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      color: #6c757d;
      font-size: 0.875rem;
      z-index: 10;
      padding: 4px;
      border-radius: 50%;
      transition: all 0.2s ease;
    }
    
    .clear-icon:hover {
      color: #dc3545;
      background-color: rgba(220, 53, 69, 0.1);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IndustrySelectorComponent implements OnInit, OnDestroy {
  @Input() title: string = "Select Industry";
  @Input() placeholder: string = "Select Industry...";
  @Input() isRequired: boolean = false;
  @Input() fetchedData: TreeNode[] = [];
  @Input() cancelLabel: string = "Cancel";
  @Input() okLabel: string = "OK";
  @Input() tip: string = "";
  @Input() isAiGenerated: boolean = false;
  @Input() showCode: boolean = false; // New input to show code for ISIC

  private _selectedIndustryId: number | undefined;

  @Input() set selectedIndustryId(id: number | undefined) {
    this._selectedIndustryId = id;
    if (id && this.flatLeafNodes.length) {
      this.findAndSelectNodeById(id);
    }
  }

  @Output() nodeSelected = new EventEmitter<TreeNode>();

  dialogVisible = false;
  dialogWidth: string = "50vw";
  isLoading$ = new BehaviorSubject<boolean>(false);
  nodes: TreeNode[] = [];
  flatLeafNodes: FlatNode[] = [];
  selectedNode: any;
  selectedFlatNode: FlatNode | null = null;
  private unsubscribe: Subscription[] = [];
  searchText: string = '';
  filteredNodes: FlatNode[] = [];

  ngOnInit(): void {
    this.loadData();
    this.handleWindowResize();
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }

  loadData() {
    if (!this.fetchedData) {
      console.error("fetchedData not provided or empty.");
      return;
    }

    this.nodes = this.fetchedData;
    this.flatLeafNodes = this.extractLeafNodes(this.nodes);
    this.filteredNodes = [...this.flatLeafNodes]; // Initialize filtered nodes
    
    if (this._selectedIndustryId) {
      this.findAndSelectNodeById(this._selectedIndustryId);
    }
  }

  private extractLeafNodes(nodes: TreeNode[], parentPath: string = ''): FlatNode[] {
    const leafNodes: FlatNode[] = [];
    
    for (const node of nodes) {
      const nodeLabel = node.label || '';
      const currentPath = parentPath ? `${parentPath} > ${nodeLabel}` : nodeLabel;
      
      if (!node.children || node.children.length === 0) {
        // This is a leaf node
        leafNodes.push({
          key: node.data?.key || node.key,
          code: node.data?.code,
          label: nodeLabel,
          fullPath: currentPath,
          originalNode: node
        });
      } else {
        // Recursively extract from children
        leafNodes.push(...this.extractLeafNodes(node.children, currentPath));
      }
    }
    
    return leafNodes.sort((a, b) => a.label.localeCompare(b.label));
  }

  selectedNodeLabel(): string {
    if (this.selectedFlatNode) {
      let label = this.selectedFlatNode.label;
      if (this.showCode && this.selectedFlatNode.code) {
        label = `[${this.selectedFlatNode.code}] ${label}`;
      }
      return label;
    }
    return "";
  }

  showDialog() {
    this.searchText = ''; // Reset search when opening dialog
    this.filteredNodes = [...this.flatLeafNodes]; // Reset filtered nodes
    this.dialogVisible = true;
  }

  onOk() {
    if (this.isValidSelection() && this.selectedFlatNode) {
      this.selectedNode = this.selectedFlatNode.originalNode;
      this.dialogVisible = false;
      this.nodeSelected.emit(this.selectedFlatNode.originalNode);
    }
  }

  onCancel() {
    this.dialogVisible = false;
  }

  isValidSelection(): boolean {
    return !!this.selectedFlatNode;
  }

  handleWindowResize() {
    const screenwidth$ = fromEvent(window, "resize").pipe(
      map(() => window.innerWidth),
      startWith(window.innerWidth)
    );

    const sub = screenwidth$.subscribe((width) => {
      this.dialogWidth = width < 768 ? "100vw" : "70vw";
    });
    this.unsubscribe.push(sub);
  }

  private findAndSelectNodeById(id: number) {
    const found = this.flatLeafNodes.find(node => node.key === id);
    if (found) {
      this.selectedFlatNode = found;
      this.selectedNode = found.originalNode;
    }
  }

  filterNodes() {
    const searchTerm = this.searchText.toLowerCase();
    this.filteredNodes = this.flatLeafNodes.filter(node =>
      node.label.toLowerCase().includes(searchTerm) ||
      (node.code && node.code.toLowerCase().includes(searchTerm))
    );
  }

  selectItem(option: FlatNode) {
    this.selectedFlatNode = option;
    this.selectedNode = option.originalNode;
  }

  trackByKey(index: number, item: FlatNode) {
    return item.key;
  }

  clearSelection(event: Event) {
    event.stopPropagation(); // Prevent triggering the input click event
    this.selectedFlatNode = null;
    this.selectedNode = null;
    this._selectedIndustryId = undefined;
    
    // Emit a clear event - we need to create a mock TreeNode with null/undefined data
    const clearNode: TreeNode = {
      label: '',
      data: { key: null }
    };
    this.nodeSelected.emit(clearNode);
  }
}