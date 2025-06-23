import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  ChangeDetectionStrategy,
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

@Component({
  selector: "app-get-hs-code-by-isic",
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    FormsModule,
    InputTextModule,
    NgbTooltipModule
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
            placeholder="Search HS Codes..."
            [(ngModel)]="searchText"
            (input)="filterCodes()"
          />
        </div>
        
        <!-- Loading indicator -->
        <div *ngIf="isLoading$ | async" class="text-center p-4">
          <i class="pi pi-spinner pi-spin"></i>
          <div>Loading HS Codes...</div>
        </div>
        
        <!-- List Items -->
        <div *ngIf="!(isLoading$ | async)" class="list-items">
          <div 
            *ngFor="let code of filteredCodes; trackBy: trackByKey" 
            class="list-item cursor-pointer"
            [class.selected]="code.id === selectedHSCode?.id"
            (click)="selectCode(code)"
          >
            <div class="d-flex align-items-start">
              <span class="fw-bold text-primary me-2 flex-shrink-0">[{{code.code}}]</span>
              <div class="flex-grow-1">
                <div class="fw-semibold">{{code.name}}</div>
                <small class="text-muted">Code: {{code.code}}</small>
              </div>
              <i *ngIf="code.id === selectedHSCode?.id" class="fas fa-check text-success ms-2"></i>
            </div>
          </div>
          
          <!-- No results message -->
          <div *ngIf="filteredCodes.length === 0 && hsCodes.length > 0" class="text-center p-4 text-muted">
            <i class="fas fa-search mb-2"></i>
            <div>No results found</div>
          </div>
          
          <!-- No HS codes available -->
          <div *ngIf="hsCodes.length === 0" class="text-center p-4 text-muted">
            <i class="fas fa-info-circle mb-2"></i>
            <div>No HS Codes available for this ISIC code</div>
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

    <div class="w-100" *ngIf="(hsCodes.length > 0) || (isLoading$ | async)">
      <label class="d-flex align-items-center form-label mb-3" [ngClass]="{'required': isRequired}">
        {{ title }}
        <i class="fas fa-exclamation-circle mx-2 fs-7" ngbTooltip="{{tip}}"></i>
        <span class="text-muted fs-8 mx-2" *ngIf="!isRequired"> (optional) </span>
      </label>

      <div *ngIf="isLoading$ | async" class="text-center">
        Loading HS Codes...
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
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GetHsCodeByIsicComponent implements OnDestroy,OnChanges {
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
  isLoading$ = new BehaviorSubject<boolean>(false);
  hsCodes: HSCode[] = [];
  filteredCodes: HSCode[] = [];
  selectedHSCode: HSCode | null = null;
  searchText: string = '';
  private unsubscribe: Subscription[] = [];

  constructor(private hsCodeService: HSCodeService) {}

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isicCodeId']) {
      this.loadHSCodes().then(() => {
        if (this.preselectedHSCodeId) {
          this.selectedHSCode = this.hsCodes.find(code => code.id === this.preselectedHSCodeId) || null;
        }
      });
    }
  }

  async loadHSCodes() {
    if (!this.isicCodeId) {
      console.error("ISIC Code ID not provided");
      return;
    }

    console.log('Loading HS Codes for ISIC:', this.isicCodeId);
    this.isLoading$.next(true);
    
    return new Promise<void>((resolve) => {
      const sub = this.hsCodeService.getHSCodeByISIC(this.isicCodeId, this.language).subscribe({
        next: (codes) => {
          console.log('Received HS Codes:', codes);
          this.hsCodes = codes.sort((a, b) => a.code.localeCompare(b.code));
          this.filteredCodes = [...this.hsCodes];
          this.isLoading$.next(false);
          resolve();
        },
        error: (error) => {
          console.error('Error loading HS Codes:', error);
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

  selectCode(code: HSCode) {
    this.selectedHSCode = code;
  }

  trackByKey(index: number, item: HSCode) {
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
    this.filteredCodes = [...this.hsCodes]; // Reset filtered codes
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
      this.dialogWidth = width < 768 ? "100vw" : "50vw";
    });
    this.unsubscribe.push(sub);
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
