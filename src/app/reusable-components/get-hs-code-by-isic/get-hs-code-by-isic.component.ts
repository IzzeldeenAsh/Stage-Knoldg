import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnChanges,
  SimpleChanges,
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
import { NgbTooltipModule } from "@ng-bootstrap/ng-bootstrap";
import { HSCode, HSCodeService } from 'src/app/_fake/services/hs-code-management/hscode.service';
import { TranslateModule } from "@ngx-translate/core";

@Component({
  selector: "app-get-hs-code-by-isic",
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    FormsModule,
    InputTextModule,
    NgbTooltipModule,
    TranslateModule
  ],
  template: `
    <p-dialog
      [header]="title"
      [(visible)]="dialogVisible"
      [modal]="true"
      [style]="getDialogStyle()"
      [contentStyle]="getDialogContentStyle()"
      appendTo="body"
    >
      <div class="list-container">
        <!-- Search Input -->
        <div class="search-container mb-3">
          <input
            type="text"
            pInputText
            class="w-100"
            placeholder="{{ 'SEARCH' | translate }}..."
            [(ngModel)]="searchText"
            (input)="filterCodes()"
          />
        </div>
        
        <!-- Loading indicator -->
        <div *ngIf="isLoading$ | async" class="text-center p-4">
          <i class="pi pi-spinner pi-spin"></i>
          <div>{{ 'COMMON.LOADING' | translate }}...</div>
        </div>
        
        <!-- List Items -->
        <div *ngIf="!(isLoading$ | async)" class="list-items">
          <!-- Related Section (only if ISIC is selected and we have related codes) -->
          <div *ngIf="isicCodeId && relatedHSCodes.length > 0 && !showAllCodes" class="mb-3">
            <div class="section-header-clean mb-3">
              <h3 class="mb-1 text-primary fw-bold">
                <i class="fas fa-link me-2"></i>
                {{ 'RELATED' | translate }}
              </h3>
              <small class="text-muted">{{ 'RELATED_HS_CODES_FOR_ISIC' | translate }}</small>
            </div>

            <!-- Related codes -->
            <div
              *ngFor="let code of getFilteredRelatedCodes(); trackBy: trackByKey"
              class="list-item-clean cursor-pointer"
              [class.selected]="code.id === selectedHSCode?.id"
              (click)="selectCode(code)"
            >
              <div class="d-flex align-items-start">
                <span class="fw-bold text-primary me-2 flex-shrink-0">[{{code.code}}]</span>
                <div class="flex-grow-1">
                  <div class="fw-semibold text-dark">{{code.name}}</div>
                  <small class="text-muted">Code: {{code.code}}</small>
                </div>
                <i *ngIf="code.id === selectedHSCode?.id" class="fas fa-check text-success ms-2"></i>
              </div>
            </div>

            <!-- View All Button -->
            <div class="text-center mt-3 mb-3">
              <button
                type="button"
                class="btn btn-outline-secondary btn-sm"
                (click)="toggleViewAllCodes()"
              >
                <i class="fas fa-eye me-1"></i>
                {{ 'VIEW_ALL' | translate }}
              </button>
            </div>
          </div>

          <!-- All Codes Section (when showing all or no ISIC selected) -->
          <div *ngIf="(!isicCodeId) || (relatedHSCodes.length === 0) || showAllCodes">
            <!-- Related Codes with divider (when both related and all are shown) -->
            <div *ngIf="isicCodeId && relatedHSCodes.length > 0 && showAllCodes" class="mb-3">
              <!-- Related section header -->
              <div class="section-header-clean mb-3">
                <h3 class="mb-1 text-primary fw-bold">
                  <i class="fas fa-link me-2"></i>
                  {{ 'RELATED' | translate }}
                </h3>
                <small class="text-muted">{{ 'RELATED_HS_CODES_FOR_ISIC' | translate }}</small>
              </div>

              <!-- Related codes list -->
              <div
                *ngFor="let code of getFilteredRelatedCodes(); trackBy: trackByKey"
                class="list-item-clean cursor-pointer"
                [class.selected]="code.id === selectedHSCode?.id"
                (click)="selectCode(code)"
              >
                <div class="d-flex align-items-start">
                  <span class="fw-bold text-primary me-2 flex-shrink-0">[{{code.code}}]</span>
                  <div class="flex-grow-1">
                    <div class="fw-semibold text-dark">{{code.name}}</div>
                    <small class="text-muted">Code: {{code.code}}</small>
                  </div>
                  <i *ngIf="code.id === selectedHSCode?.id" class="fas fa-check text-success ms-2"></i>
                </div>
              </div>

              <!-- Divider -->
              <hr class="my-4 divider-clean">
            </div>

            <!-- Other HS Codes section header (when showing all after related) -->
            <div *ngIf="isicCodeId && relatedHSCodes.length > 0 && showAllCodes" class="section-header-clean mb-3">
              <h3 class="mb-1 text-muted fw-bold">
                <i class="fas fa-list me-2"></i>
                {{ 'OTHER_HS_CODES' | translate }}
              </h3>
              <small class="text-muted">{{ 'ALL_OTHER_AVAILABLE_HS_CODES' | translate }}</small>
            </div>

            <!-- Other codes list -->
            <div
              *ngFor="let code of getFilteredNonRelatedCodes(); trackBy: trackByKey"
              class="list-item-clean cursor-pointer"
              [class.selected]="code.id === selectedHSCode?.id"
              (click)="selectCode(code)"
            >
              <div class="d-flex align-items-start">
                <span class="fw-bold text-primary me-2 flex-shrink-0">[{{code.code}}]</span>
                <div class="flex-grow-1">
                  <div class="fw-semibold text-dark">{{code.name}}</div>
                  <small class="text-muted">Code: {{code.code}}</small>
                </div>
                <i *ngIf="code.id === selectedHSCode?.id" class="fas fa-check text-success ms-2"></i>
              </div>
            </div>
          </div>

          <!-- No results message -->
          <div *ngIf="filteredCodes.length === 0 && hsCodes.length > 0" class="text-center p-4 text-muted">
            <i class="fas fa-search mb-2"></i>
            <div>{{ 'NO_RESULTS_FOUND' | translate }}</div>
          </div>

          <!-- No HS codes available -->
          <div *ngIf="hsCodes.length === 0 && allHSCodes.length === 0" class="text-center p-4 text-muted">
            <i class="fas fa-info-circle mb-2"></i>
            <div>{{ 'NO_HS_CODES_AVAILABLE' | translate }}</div>
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
      <label class="d-flex align-items-center form-label mb-3" [ngClass]="{'required': isRequired}">
        {{ title }}
        <i class="fas fa-exclamation-circle mx-2 fs-7" ngbTooltip="{{tip}}"></i>
        <span class="text-muted fs-8 mx-1" *ngIf="!isRequired"> (optional) </span>
      </label>

      <div *ngIf="isLoading$ | async" class="text-center">
        {{ 'COMMON.LOADING' | translate }} HS Codes...
      </div>

      <div *ngIf="!(isLoading$ | async)" class="position-relative">
        <input
          type="text"
          pInputText
          class="w-100"
          [readonly]="true"
          [placeholder]="placeholder"
          (click)="showDialog()"
          [value]="selectedHSCodeLabel()"
        />
        <!-- Clear icon -->
        <i 
          *ngIf="selectedHSCode" 
          class="fas fa-times clear-icon position-absolute"
          (click)="clearSelection($event)"
          title="Clear selection"
        ></i>
      </div>
    </div>
  `,
  styles: [`
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

    /* Clean section headers - no background, no border */
    .section-header-clean {
      padding: 0;
    }

    .section-header-clean h6 {
      margin-bottom: 0.25rem;
      font-size: 0.875rem;
    }

    /* Clean list items */
    .list-item-clean {
      padding: 12px 0;
      border-bottom: 1px solid #f1f1f1;
      transition: all 0.2s ease;
    }

    .list-item-clean:hover {
      background-color: rgba(var(--bs-primary-rgb), 0.02);
    }

    .list-item-clean.selected {
      background-color: rgba(var(--bs-primary-rgb), 0.05);
    }

    .list-item-clean:last-child {
      border-bottom: none;
    }

    /* Clean divider styling */
    .divider-clean {
      border: none;
      height: 1px;
      background: linear-gradient(90deg,
        transparent 0%,
        rgba(var(--bs-secondary-rgb), 0.2) 25%,
        rgba(var(--bs-secondary-rgb), 0.4) 50%,
        rgba(var(--bs-secondary-rgb), 0.2) 75%,
        transparent 100%
      );
      margin: 24px 0;
    }

    /* RTL support */
    :host-context([dir="rtl"]) .clear-icon,
    :host-context(.rtl) .clear-icon,
    :host-context(html[lang="ar"]) .clear-icon {
      right: auto;
      left: 12px;
    }

    /* Mobile fullscreen adjustments */
    @media (max-width: 767px) {
      .list-container {
        min-height: auto;
        max-height: calc(100vh - 200px);
      }
      
      .list-items {
        max-height: calc(100vh - 250px);
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GetHsCodeByIsicComponent implements OnInit, OnDestroy, OnChanges {
  @Input() title: string = "Select HS Code";
  @Input() placeholder: string = "Select HS Code...";
  @Input() isRequired: boolean = false;
  @Input() isicCodeId!: number;
  @Input() cancelLabel: string = "Cancel";
  @Input() okLabel: string = "OK";
  @Input() tip: string = "Select an HS Code for the selected ISIC Code";
  @Input() language: string = "en";
  @Input() preselectedHSCodeId?: number;

  @Output() hsCodeSelected = new EventEmitter<HSCode>();

  dialogVisible = false;
  dialogWidth: string = "80vw";
  dialogHeight: string = "auto";
  isMobile: boolean = false;
  isLoading$ = new BehaviorSubject<boolean>(false);
  hsCodes: HSCode[] = [];
  allHSCodes: HSCode[] = [];
  relatedHSCodes: HSCode[] = [];
  filteredCodes: HSCode[] = [];
  selectedHSCode: HSCode | null = null;
  searchText: string = '';
  showAllCodes: boolean = false;
  private unsubscribe: Subscription[] = [];

  constructor(
    private hsCodeService: HSCodeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Load HS codes on initialization
    this.loadHSCodes();
    // Set up responsive dialog sizing
    this.handleWindowResize();
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isicCodeId']) {
      // Don't reload if we already have HS codes loaded
      if (this.allHSCodes.length > 0) {
        this.updateRelatedCodes();
      } else {
        this.showAllCodes = false;
        this.loadHSCodes().then(() => {
          if (this.preselectedHSCodeId) {
            this.selectedHSCode = this.allHSCodes.find(code => code.id === this.preselectedHSCodeId) || null;
          }
        });
      }
    }
  }

  async loadHSCodes() {
    this.isLoading$.next(true);

    return new Promise<void>((resolve) => {
      // Only load all HS codes
      const sub = this.hsCodeService.getHSCodes().subscribe({
        next: (codes) => {
          this.allHSCodes = (codes || []).sort((a: HSCode, b: HSCode) => a.code.localeCompare(b.code));
          this.updateRelatedCodes();
          this.isLoading$.next(false);
          resolve();
        },
        error: (error) => {
          console.error('Error loading HS Codes:', error);
          this.allHSCodes = [];
          this.relatedHSCodes = [];
          this.hsCodes = [];
          this.filteredCodes = [];
          this.isLoading$.next(false);
          resolve();
        }
      });
      this.unsubscribe.push(sub);
    });
  }

  filterCodes() {
    this.filteredCodes = this.hsCodes.filter(code =>
      code.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
      code.code.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  toggleViewAllCodes() {
    this.showAllCodes = !this.showAllCodes;
    this.updateDisplayedCodes();
  }

  private updateRelatedCodes() {
    if (this.isicCodeId && this.allHSCodes.length > 0) {
      // Filter related codes based on isic_code_id property
      this.relatedHSCodes = this.allHSCodes.filter(code =>
        code.isic_code_id === this.isicCodeId
      ).sort((a: HSCode, b: HSCode) => a.code.localeCompare(b.code));

      // Check if currently selected HS code is in related codes
      const selectedIsInRelated = this.selectedHSCode &&
        this.relatedHSCodes.some(code => code.id === this.selectedHSCode!.id);

      // If we have a selected HS code that's not in related codes, show all immediately
      if (this.selectedHSCode && !selectedIsInRelated) {
        this.showAllCodes = true;
      } else {
        this.showAllCodes = false;
      }

      this.updateDisplayedCodes();
    } else {
      // No ISIC selected, show all codes
      this.relatedHSCodes = [];
      this.showAllCodes = false;
      this.updateDisplayedCodes();
    }
  }

  private updateDisplayedCodes() {
    if (this.isicCodeId && this.relatedHSCodes.length > 0) {
      // If ISIC is selected and we have related codes
      if (this.showAllCodes) {
        // Show all codes (will be split into related + non-related in template)
        this.hsCodes = [...this.allHSCodes];
      } else {
        // Show only related codes
        this.hsCodes = [...this.relatedHSCodes];
      }
    } else {
      // No ISIC selected or no related codes, always show all
      this.hsCodes = [...this.allHSCodes];
      this.showAllCodes = false; // No need for toggle
    }
    this.filteredCodes = [...this.hsCodes];
    this.filterCodes(); // Apply current search filter
  }

  getFilteredRelatedCodes(): HSCode[] {
    return this.relatedHSCodes.filter(code =>
      code.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
      code.code.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  getFilteredNonRelatedCodes(): HSCode[] {
    const relatedIds = new Set(this.relatedHSCodes.map(code => code.id));
    return this.allHSCodes
      .filter(code => !relatedIds.has(code.id))
      .filter(code =>
        code.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
        code.code.toLowerCase().includes(this.searchText.toLowerCase())
      );
  }

  selectCode(code: HSCode) {
    this.selectedHSCode = code;

    // If ISIC is selected and this code is not in related codes, automatically show all codes
    if (this.isicCodeId && this.relatedHSCodes.length > 0) {
      const isInRelated = this.relatedHSCodes.some(relatedCode => relatedCode.id === code.id);
      if (!isInRelated && !this.showAllCodes) {
        this.showAllCodes = true;
        this.updateDisplayedCodes();
      }
    }
  }

  trackByKey(_index: number, item: HSCode) {
    return item.id;
  }

  selectedHSCodeLabel(): string {
    if (this.selectedHSCode) {
      return `[${this.selectedHSCode.code}] ${this.selectedHSCode.name}`;
    }
    return "";
  }

  showDialog() {
    this.searchText = ''; // Reset search when opening dialog
    this.showAllCodes = false; // Reset to show related codes first (if any)
    this.updateDisplayedCodes();
    this.dialogVisible = true;
    this.loadHSCodes();
  }

  onOk() {
    if (this.isValidSelection() && this.selectedHSCode) {
      this.dialogVisible = false;
      this.hsCodeSelected.emit(this.selectedHSCode);
    }
  }

  onCancel() {
    this.dialogVisible = false;
  }

  isValidSelection(): boolean {
    return !!this.selectedHSCode;
  }

  handleWindowResize() {
    const screenwidth$ = fromEvent(window, "resize").pipe(
      map(() => window.innerWidth),
      startWith(window.innerWidth)
    );

    const sub = screenwidth$.subscribe((width) => {
      this.isMobile = width < 768;
      if (this.isMobile) {
        // Mobile: fullscreen
        this.dialogWidth = "100vw";
        this.dialogHeight = "100vh";
      } else {
        // Desktop: normal size
        this.dialogWidth = "80vw";
        this.dialogHeight = "auto";
      }
      this.cdr.markForCheck();
    });
    this.unsubscribe.push(sub);
  }

  getDialogStyle(): any {
    return {
      width: this.dialogWidth,
      height: this.isMobile ? this.dialogHeight : 'auto',
      'max-height': '100vh',
      overflow: 'hidden',
      margin: this.isMobile ? '0' : undefined,
      borderRadius: this.isMobile ? '0' : undefined
    };
  }

  getDialogContentStyle(): any {
    return {
      'max-height': this.isMobile ? 'calc(100vh - 120px)' : 'calc(90vh - 100px)',
      overflow: 'auto',
      padding: this.isMobile ? '1rem' : undefined
    };
  }

  clearSelection(event: Event) {
    event.stopPropagation(); // Prevent triggering the input click event
    this.selectedHSCode = null;
    
    // Emit a clear event - create a mock HSCode with null/undefined id
    const clearCode: HSCode = {
      id: null as any,
      code: '',
      name: '',
      isic_code_id: 0,
      status: '',
      names: {
        en: '',
        ar: ''
      }
    };
    this.hsCodeSelected.emit(clearCode);
  }
}
