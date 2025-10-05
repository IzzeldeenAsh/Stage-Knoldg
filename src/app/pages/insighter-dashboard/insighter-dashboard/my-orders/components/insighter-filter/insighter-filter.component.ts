import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Insighter, InsightersService } from '../../services/insighters.service';

type Language = 'ar' | 'en';

@Component({
  selector: 'app-insighter-filter',
  templateUrl: './insighter-filter.component.html',
  styleUrls: ['./insighter-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InsighterFilterComponent implements OnInit {
  @Input() lang: Language = 'en';
  @Input() selectedInsighterUuid: string | null = null;
  @Output() insighterSelected = new EventEmitter<string | null>();

  insighters$: Observable<Insighter[]> = of([]);
  isLoading$!: Observable<boolean>;

  constructor(private insightersService: InsightersService) {}

  ngOnInit(): void {
    this.isLoading$ = this.insightersService.isLoading$;
    this.loadInsighters();
  }

  onInsighterChange(insighterUuid: string | null): void {
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
  }
}