import { Component, Input, Output, EventEmitter, OnInit, OnChanges, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslationModule } from 'src/app/modules/i18n';
import { DropdownModule } from 'primeng/dropdown';

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
  imports: [CommonModule, FormsModule, TranslationModule, DropdownModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CountryDropdownComponent),
      multi: true
    }
  ],
  template: `
    <div class="country-dropdown-wrapper" [class.rtl]="lang === 'ar'">
      <p-dropdown
        [options]="countries"
        [(ngModel)]="selectedCountryId"
        [placeholder]="placeholder"
        [filter]="enableSearch"
        [filterPlaceholder]="searchPlaceholder"
        [showClear]="showClear"
        [disabled]="false"
        appendTo="body"
        [style]="{width: '100%'}"
        [styleClass]="isInvalid ? 'is-invalid' : ''"
        optionLabel="displayName"
        optionValue="id"
        (onChange)="onCountryChange($event)"
        (onClear)="onClearCountry()"
      >
        <ng-template pTemplate="selectedItem" let-selectedOption>
          <div class="selected-country d-flex align-items-center" *ngIf="selectedOption">
            <img 
              *ngIf="selectedOption.showFlag"
              [src]="'../../../../assets/media/flags/' + selectedOption.flag + '.svg'"
              (error)="onFlagError(selectedOption)"
              alt="{{ selectedOption.names.en }}"
              class="flag-icon w-20px me-2" 
            />
            <span>{{ getDisplayName(selectedOption) }}</span>
          </div>
        </ng-template>
        
        <ng-template pTemplate="item" let-country>
          <div class="dropdown-item-content d-flex align-items-center">
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
          </div>
        </ng-template>
      </p-dropdown>
    </div>
  `,
  styles: [`
    .country-dropdown-wrapper {
      position: relative;
    }

    .selected-country {
      display: flex;
      align-items: center;
      width: 100%;
    }

    .dropdown-item-content {
      width: 100%;
    }

    .flag-icon {
      flex-shrink: 0;
    }

    .rtl .selected-country {
      direction: rtl;
    }

    .rtl .flag-icon {
      margin-left: 0.5rem;
      margin-right: 0;
    }

    /* Override PrimeNG dropdown styles for RTL */
    .rtl ::ng-deep .p-dropdown {
      direction: rtl;
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

  selectedCountry: Country | null = null;
  selectedCountryId: number | null = null;
  currentValue: any = null;

  private onChange = (value: any) => {};
  private onTouched = () => {};

  ngOnInit() {
    console.log('Component initialized with countries:', this.countries.length); // Debug log
    this.prepareCountriesData();
  }

  ngOnChanges() {
    if (this.countries && this.countries.length > 0) {
      console.log('Countries updated:', this.countries.length); // Debug log
      this.prepareCountriesData();
      
      // Re-evaluate selected country if we have a value but no selected country yet
      if (this.currentValue && !this.selectedCountry) {
        const numericValue = typeof this.currentValue === 'string' ? parseInt(this.currentValue, 10) : this.currentValue;
        this.selectedCountry = this.countries.find(country => country.id === numericValue) || null;
        this.selectedCountryId = this.selectedCountry?.id || null;
        console.log('Re-evaluated selected country:', this.selectedCountry);
        
        if (!this.selectedCountry) {
          console.warn('Country not found in ngOnChanges for ID:', numericValue);
        }
      }
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: any): void {
    this.currentValue = value;
    console.log('writeValue called with:', value, 'type:', typeof value);
    console.log('Available countries:', this.countries.map(c => ({ id: c.id, name: c.names?.en })));
    
    if (value) {
      // Ensure value is a number for comparison
      const numericValue = typeof value === 'string' ? parseInt(value, 10) : value;
      console.log('Looking for country with ID:', numericValue);
      
      this.selectedCountry = this.countries.find(country => country.id === numericValue) || null;
      this.selectedCountryId = this.selectedCountry?.id || null;
      console.log('Selected country after writeValue:', this.selectedCountry);
      
      if (!this.selectedCountry) {
        console.warn('Country not found for ID:', numericValue);
        console.log('Available country IDs:', this.countries.map(c => c.id));
      }
    } else {
      this.selectedCountry = null;
      this.selectedCountryId = null;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(): void {
    // Handle disabled state if needed
  }

  prepareCountriesData() {
    // Add displayName property to each country for PrimeNG dropdown
    this.countries.forEach(country => {
      (country as any).displayName = this.getDisplayName(country);
    });
  }

  onCountryChange(event: any) {
    const countryId = event.value;
    this.selectedCountry = this.countries.find(country => country.id === countryId) || null;
    this.selectedCountryId = countryId;
    this.onChange(countryId);
    this.countrySelected.emit(this.selectedCountry!);
  }

  onClearCountry() {
    this.selectedCountry = null;
    this.selectedCountryId = null;
    this.onChange(null);
    this.countryCleared.emit();
  }

  getDisplayName(country: Country): string {
    return this.lang === 'ar' ? country.names.ar : country.names.en;
  }

  onFlagError(country: Country) {
    country.showFlag = false;
  }

  trackByCountryId(_: number, country: Country): number {
    return country.id;
  }
}