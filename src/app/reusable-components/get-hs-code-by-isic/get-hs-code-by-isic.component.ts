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
import { DropdownModule } from 'primeng/dropdown';
import { HSCode, HSCodeService } from 'src/app/_fake/services/hs-code-management/hscode.service';

@Component({
  selector: "app-get-hs-code-by-isic",
  standalone: true,
  imports: [
    CommonModule,
    DialogModule,
    FormsModule,
    InputTextModule,
    NgbTooltipModule,
    DropdownModule
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
      <div class="hs-code-container">
        <p-dropdown
        
          [options]="hsCodes"
          [(ngModel)]="selectedHSCode"
          [filter]="true"
          filterBy="code,name"
          [showClear]="true"
          placeholder="Search HS Code"
          optionLabel="name"
          [loading]="(isLoading$ | async) || false"
          appendTo="body"
          [style]="{width:'90%',maxWidth:'90%'}"
        >
          <ng-template pTemplate="selectedItem">
            <div class="hs-code-item" *ngIf="selectedHSCode">
              <div>
                <span class="font-bold">{{selectedHSCode.code}}</span> - 
                {{selectedHSCode.name}}
              </div>
            </div>
          </ng-template>
          <ng-template let-code pTemplate="item">
            <div class="hs-code-item">
              <div>
                <span class="font-bold">{{code.code}}</span> - 
                {{code.name}}
              </div>
            </div>
          </ng-template>
        </p-dropdown>
        <div *ngIf="hsCodes.length === 0 && !(isLoading$ | async)" class="text-center p-3">
          No HS Codes available for this ISIC code
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

      <div *ngIf="!(isLoading$ | async)">
        <input
          type="text"
          pInputText
          class="w-100"
          [readonly]="true"
          [placeholder]="placeholder"
          (click)="showDialog()"
          [value]="selectedHSCodeLabel()"
        />
      </div>
    </div>
  `,
  styles: [`
    .hs-code-container {
      min-height: 100px;
      padding: 1rem;
    }
    .hs-code-item {
      display: flex;
      align-items: center;
      padding: 0.5rem;
      white-space:pre-line;
    }
    .font-bold {
      font-weight: bold;
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
  selectedHSCode: HSCode | null = null;
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
          this.hsCodes = codes;
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

  selectedHSCodeLabel(): string {
    if (this.selectedHSCode) {
      return `${this.selectedHSCode.code} - ${this.selectedHSCode.name}`;
    }
    return "";
  }

  showDialog() {
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
    this.selectedHSCode = null;
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
}
