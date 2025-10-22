import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { Observable, of, combineLatest } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Insighter, InsightersService } from '../../my-orders/services/insighters.service';

type Language = 'ar' | 'en';

interface DropdownOption {
  label: string;
  value: string | null;
  insighter?: Insighter;
}

@Component({
  selector: 'app-insighter-filter',
  templateUrl: './insighter-filter.component.html',
  styleUrls: ['./insighter-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InsighterFilterComponent implements OnInit, OnChanges {
  @Input() lang: Language = 'en';
  @Input() selectedInsighterUuid: string | null = null;
  @Output() insighterSelected = new EventEmitter<string | null>();

  insighters$: Observable<Insighter[]> = of([]);
  dropdownOptions$: Observable<DropdownOption[]> = of([]);
  isLoading$!: Observable<boolean>;
  selectedInsighterValue: string | null = null;

  constructor(private insightersService: InsightersService) {}

  ngOnInit(): void {
    this.isLoading$ = this.insightersService.isLoading$;
    this.loadInsighters();
    this.selectedInsighterValue = this.selectedInsighterUuid;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedInsighterUuid']) {
      this.selectedInsighterValue = this.selectedInsighterUuid;
    }
  }

  onInsighterChange(insighterUuid: string | null): void {
    this.selectedInsighterValue = insighterUuid;
    this.insighterSelected.emit(insighterUuid);
  }

  getInsighterInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  private loadInsighters(): void {
    this.insighters$ = this.insightersService.getInsighters().pipe(
      map(response => response.data || []),
      catchError(() => of([]))
    );

    this.dropdownOptions$ = this.insighters$.pipe(
      map(insighters => {
        const options: DropdownOption[] = [
          {
            label: this.lang === 'ar' ? 'جميع الخبراء' : 'All Insighters',
            value: null
          }
        ];

        const insighterOptions = insighters.map(insighter => ({
          label: insighter.name,
          value: insighter.uuid,
          insighter: insighter
        }));

        return [...options, ...insighterOptions];
      })
    );
  }
}