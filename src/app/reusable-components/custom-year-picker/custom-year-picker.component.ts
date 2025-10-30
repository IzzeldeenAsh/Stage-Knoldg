import { Component, Input, Output, EventEmitter, forwardRef, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

interface YearRange {
  startYear: number | null;
  endYear: number | null;
}

@Component({
  selector: 'app-custom-year-picker',
  templateUrl: './custom-year-picker.component.html',
  styleUrls: ['./custom-year-picker.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomYearPickerComponent),
      multi: true
    }
  ]
})
export class CustomYearPickerComponent implements OnInit, ControlValueAccessor {
  @Input() placeholder: string = 'Select year';
  @Input() yearRangeStart: number = 1900;
  @Input() yearRangeEnd: number = 2030;
  @Input() allowRange: boolean = true;
  @Input() currentLang: string = 'en';

  @Output() yearChange = new EventEmitter<YearRange>();

  isOpen = false;
  selectedYears: number[] = [];
  years: number[] = [];

  private onChange = (value: any) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.generateYears();
  }

  private generateYears() {
    this.years = [];
    for (let year = this.yearRangeEnd; year >= this.yearRangeStart; year--) {
      this.years.push(year);
    }
  }

  togglePicker() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.onTouched();
    }
  }

  closePicker() {
    this.isOpen = false;
  }

  selectYear(year: number) {
    if (!this.allowRange) {
      // Single year selection
      this.selectedYears = [year];
    } else {
      // Range selection logic
      if (this.selectedYears.length === 0) {
        this.selectedYears = [year];
      } else if (this.selectedYears.length === 1) {
        if (this.selectedYears[0] === year) {
          // Same year clicked, keep single selection
          this.selectedYears = [year];
        } else {
          // Add second year and sort
          this.selectedYears = [this.selectedYears[0], year].sort((a, b) => a - b);
        }
      } else {
        // Start new selection
        this.selectedYears = [year];
      }
    }

    this.updateValue();
  }

  private updateValue() {
    const range: YearRange = {
      startYear: this.selectedYears.length > 0 ? this.selectedYears[0] : null,
      endYear: this.selectedYears.length > 1 ? this.selectedYears[1] : this.selectedYears[0]
    };

    this.onChange(range);
    this.yearChange.emit(range);
  }

  clearSelection() {
    this.selectedYears = [];
    this.updateValue();
  }

  isYearSelected(year: number): boolean {
    return this.selectedYears.includes(year);
  }

  isYearInRange(year: number): boolean {
    if (this.selectedYears.length !== 2) return false;
    const [start, end] = this.selectedYears;
    return year > start && year < end;
  }

  isStartYear(year: number): boolean {
    return this.selectedYears.length >= 1 && this.selectedYears[0] === year;
  }

  isEndYear(year: number): boolean {
    return this.selectedYears.length === 2 && this.selectedYears[1] === year;
  }

  getDisplayText(): string {
    if (this.selectedYears.length === 0) {
      return this.placeholder;
    } else if (this.selectedYears.length === 1) {
      return this.selectedYears[0].toString();
    } else {
      return `${this.selectedYears[0]}-${this.selectedYears[1]}`;
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: YearRange | null): void {
    if (value && (value.startYear !== null || value.endYear !== null)) {
      this.selectedYears = [];
      if (value.startYear !== null) {
        this.selectedYears.push(value.startYear);
      }
      if (value.endYear !== null && value.endYear !== value.startYear) {
        this.selectedYears.push(value.endYear);
      }
      // Sort the years to ensure proper order
      this.selectedYears.sort((a, b) => a - b);
    } else {
      this.selectedYears = [];
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Implement disabled state if needed
    // For now, we'll just store the state
  }
}