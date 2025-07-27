import { Component, Input, Output, EventEmitter, OnInit, OnChanges, forwardRef, ViewChild, ElementRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationModule } from 'src/app/modules/i18n';

export interface Country {
  id: number;
  region_id: number;
  iso2: string;
  iso3: string;
  nationality: string;
  nationalities: {
    en: string;
    ar: string;
  };
  international_code: string;
  flag: string;
  name: string;
  names: {
    en: string;
    ar: string;
  };
  status: string;
  showFlag?: boolean;
}

@Component({
  selector: 'app-country-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslationModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CountryDropdownComponent),
      multi: true
    }
  ],
  template: `
    <div class="country-dropdown-wrapper" [class.rtl]="lang === 'ar'">
      <!-- Dropdown Toggle Button -->
      <div 
        class="form-select form-solid" 
        [class.is-invalid]="isInvalid"
        [class.show]="isOpen"
        (click)="toggleDropdown()"
        #dropdownToggle
      >
        <div class="selected-country" *ngIf="selectedCountry; else placeholder">
          <img 
            *ngIf="selectedCountry.showFlag"
            [src]="'../../../../assets/media/flags/' + selectedCountry.flag + '.svg'"
            (error)="onFlagError(selectedCountry)"
            alt="{{ selectedCountry.names.en }}"
            class="flag-icon w-20px me-2" 
          />
          <span>{{ getDisplayName(selectedCountry) }}</span>
        </div>
        <ng-template #placeholder>
          <span class="text-muted">{{ placeholder }}</span>
        </ng-template>
      </div>

      <!-- Clear Button -->
      <button 
        *ngIf="selectedCountry && showClear" 
        type="button" 
        class="btn btn-sm btn-icon position-absolute end-0 top-50 translate-middle-y me-8"
        (click)="clearSelection($event)"
        style="z-index: 10;"
      >
        <i class="ki-duotone ki-cross fs-3"></i>
      </button>

      <!-- Dropdown Menu -->
      <div 
        class="dropdown-menu w-100" 
        [class.show]="isOpen"
        style="max-height: 300px; overflow-y: auto;"
        (click)="$event.stopPropagation()"
      >
        <!-- Search Input -->
        <div class="px-3 py-2" *ngIf="enableSearch">
          <div class="position-relative">
            <input
              #searchInput
              type="text"
              class="form-control form-control-sm"
              [placeholder]="searchPlaceholder"
              [(ngModel)]="searchTerm"
              (input)="onSearchChange($event)"
              (click)="$event.stopPropagation()"
              (keydown.escape)="closeDropdown()"
              (keydown.enter)="$event.preventDefault()"
              autocomplete="off"
            />
            <i class="ki-duotone ki-magnifier fs-3 position-absolute top-50 end-0 translate-middle-y me-3"></i>
          </div>
        </div>

        <!-- Country Options -->
        <div class="dropdown-item-list">
          <button
            *ngFor="let country of filteredCountries; trackBy: trackByCountryId"
            type="button"
            class="dropdown-item d-flex align-items-center"
            [class.active]="country.id === selectedCountry?.id"
            (click)="selectCountry(country)"
          >
            <img 
              *ngIf="country.showFlag"
              [src]="'../../../../assets/media/flags/' + country.flag + '.svg'"
              (error)="onFlagError(country)"
              alt="{{ country.names.en }}"
              class="flag-icon w-20px me-3" 
            />
            <span>{{ getDisplayName(country) }}</span>
            <span *ngIf="showCode && country.international_code" class="text-muted ms-auto">
              (+{{ country.international_code }})
            </span>
          </button>
          
          <!-- No Results -->
          <div *ngIf="filteredCountries.length === 0" class="dropdown-item text-muted">
            {{ 'No countries found' }}
          </div>
        </div>
      </div>

      <!-- Overlay -->
      <div 
        *ngIf="isOpen" 
        class="dropdown-backdrop" 
        (click)="closeDropdown()"
      ></div>
    </div>
  `,
  styles: [`
    .country-dropdown-wrapper {
      position: relative;
    }

    .form-select {
      cursor: pointer;
      padding-right: 3rem;
      min-height: 44px;
      display: flex;
      align-items: center;
    }

    .selected-country {
      display: flex;
      align-items: center;
      width: 100%;
    }

    .flag-icon {
      flex-shrink: 0;
    }

    .dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      z-index: 1050;
      border: 1px solid #e4e6ef;
      border-radius: 0.625rem;
      box-shadow: 0 0.5rem 1.5rem 0.5rem rgba(0, 0, 0, 0.075);
      background: #ffffff;
    }

    .dropdown-menu.show {
      display: block;
    }

    .dropdown-item {
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      padding: 0.75rem 1rem;
      transition: all 0.15s ease;
    }

    .dropdown-item:hover {
      background-color: #f5f8fa;
    }

    .dropdown-item.active {
      background-color: #f1faff;
      color: #009ef7;
    }

    .dropdown-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 1040;
      background: transparent;
    }

    .rtl .selected-country {
      direction: rtl;
    }

    .rtl .flag-icon {
      margin-left: 0.5rem;
      margin-right: 0;
    }

    /* Custom scrollbar for dropdown */
    .dropdown-item-list {
      max-height: 200px;
      overflow-y: auto;
    }

    .dropdown-item-list::-webkit-scrollbar {
      width: 4px;
    }

    .dropdown-item-list::-webkit-scrollbar-track {
      background: #f1f1f1;
    }

    .dropdown-item-list::-webkit-scrollbar-thumb {
      background: #c4c4c4;
      border-radius: 2px;
    }

    .dropdown-item-list::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }
  `]
})
export class CountryDropdownComponent implements OnInit, OnChanges, ControlValueAccessor {
  @Input() countries: Country[] = [];
  @Input() placeholder: string = 'Select country...';
  @Input() searchPlaceholder: string = 'Search countries...';
  @Input() enableSearch: boolean = true;
  @Input() showClear: boolean = true;
  @Input() showCode: boolean = false;
  @Input() lang: string = 'en';
  @Input() isInvalid: boolean = false;

  @Output() countrySelected = new EventEmitter<Country>();
  @Output() countryCleared = new EventEmitter<void>();

  @ViewChild('searchInput') searchInput: ElementRef;
  @ViewChild('dropdownToggle') dropdownToggle: ElementRef;

  isOpen = false;
  searchTerm = '';
  selectedCountry: Country | null = null;
  filteredCountries: Country[] = [];
  currentValue: any = null;

  private onChange = (value: any) => {};
  private onTouched = () => {};

  ngOnInit() {
    console.log('Component initialized with countries:', this.countries.length); // Debug log
    this.filteredCountries = [...this.countries];
  }

  ngOnChanges() {
    if (this.countries && this.countries.length > 0) {
      this.filteredCountries = [...this.countries];
      console.log('Countries updated:', this.countries.length); // Debug log
      this.onSearchChange();
      
      // Re-evaluate selected country if we have a value but no selected country yet
      if (this.currentValue && !this.selectedCountry) {
        this.selectedCountry = this.countries.find(country => country.id === this.currentValue) || null;
        console.log('Re-evaluated selected country:', this.selectedCountry);
      }
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.currentValue = value;
    console.log('writeValue called with:', value);
    
    if (value) {
      this.selectedCountry = this.countries.find(country => country.id === value) || null;
      console.log('Selected country after writeValue:', this.selectedCountry);
    } else {
      this.selectedCountry = null;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Handle disabled state if needed
  }

  toggleDropdown() {
    if (this.isOpen) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown() {
    this.isOpen = true;
    this.onTouched();
    
    // Reset search when opening
    this.searchTerm = '';
    this.filteredCountries = [...this.countries];
    
    // Focus search input after dropdown opens
    setTimeout(() => {
      if (this.searchInput && this.searchInput.nativeElement) {
        this.searchInput.nativeElement.focus();
        console.log('Search input focused'); // Debug log
      }
    }, 100); // Increased timeout
  }

  closeDropdown() {
    this.isOpen = false;
    this.searchTerm = '';
    this.onSearchChange();
  }

  selectCountry(country: Country) {
    this.selectedCountry = country;
    this.onChange(country.id);
    this.countrySelected.emit(country);
    this.closeDropdown();
  }

  clearSelection(event: Event) {
    event.stopPropagation();
    this.selectedCountry = null;
    this.onChange(null);
    this.countryCleared.emit();
  }

  onSearchChange(event?: Event) {
    // Update searchTerm from event if provided
    if (event) {
      const target = event.target as HTMLInputElement;
      this.searchTerm = target.value;
    }

    console.log('Search term:', this.searchTerm); // Debug log
    
    if (!this.searchTerm.trim()) {
      this.filteredCountries = [...this.countries];
      console.log('Reset to all countries:', this.filteredCountries.length); // Debug log
      return;
    }

    const searchLower = this.searchTerm.toLowerCase();
    this.filteredCountries = this.countries.filter(country => {
      const enName = country.names?.en?.toLowerCase() || '';
      const arName = country.names?.ar?.toLowerCase() || '';
      const code = country.international_code?.toLowerCase() || '';
      
      const matches = enName.includes(searchLower) || 
                     arName.includes(searchLower) || 
                     code.includes(searchLower);
      
      return matches;
    });
    
    console.log('Filtered countries:', this.filteredCountries.length); // Debug log
  }

  getDisplayName(country: Country): string {
    return this.lang === 'ar' ? country.names.ar : country.names.en;
  }

  onFlagError(country: Country) {
    country.showFlag = false;
  }

  trackByCountryId(index: number, country: Country): number {
    return country.id;
  }
}