import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { FormsModule } from '@angular/forms';
import { RegionsService, Continent, Country } from '../../_fake/services/region/regions.service';
import { InputTextModule } from 'primeng/inputtext';
import { TruncateTextPipe } from 'src/app/pipes/truncate-pipe/truncate-text.pipe';
import { AccordionModule } from 'primeng/accordion';
import { TranslationModule } from 'src/app/modules/i18n';
import { ChipModule } from 'primeng/chip';
import { TabViewModule } from 'primeng/tabview';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { normalizeSearchText } from 'src/app/utils/search-normalize';

@Component({
  selector: 'app-select-region',
  standalone: true,
  imports: [
    CommonModule, 
    DialogModule, 
    TranslationModule,
    TruncateTextPipe, 
    FormsModule, 
    InputTextModule,
    AccordionModule, 
    ChipModule,
    TabViewModule
  ],
  templateUrl: './select-region.component.html',
  styleUrls: ['./select-region.component.scss']
})
export class SelectRegionComponent implements OnInit, OnChanges, OnDestroy {
  @Input() placeholder: string = 'Select Region...';
  @Input() title: string = 'Select Regions';
  @Input() preSelectedRegions: any = [];
  @Input() preSelectedCountries: any = [];
  @Input() displayMode: 'default' | 'onlyRegions' | 'onlyCountries' = 'default';
  @Output() regionsSelected = new EventEmitter<{ regions: number[], countries: number[] }>();
  
  // Reference to document for RTL detection
  document: Document = document;

  dialogVisible: boolean = false;
  regions: Continent[] = [];
  filteredRegions: Continent[] = [];
  selectedRegions: number[] = [];
  selectedCountries: number[] = [];
  displayValue: string = '';
  searchQuery: string = '';
  allCountries: Country[] = [];
  private allCountriesBase: Country[] = [];

  private search$ = new Subject<string>();
  private destroy$ = new Subject<void>();
  private regionNormById = new Map<number, string>();
  private countryNormById = new Map<number, string>();
  private currentNormQuery: string = '';

  constructor(private regionsService: RegionsService) {}

  ngOnInit() {
    this.loadRegions();
    this.selectedRegions = this.preSelectedRegions ? [...this.preSelectedRegions] : [];
    this.selectedCountries = this.preSelectedCountries ? [...this.preSelectedCountries] : [];
    this.updateDisplayValue();

    // Debounce filtering so typing stays responsive.
    this.search$
      .pipe(
        debounceTime(120),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((q) => {
        this.applyFilter(q);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['preSelectedRegions'] || changes['preSelectedCountries']) {
      // Handle preSelectedRegions changes
      if (changes['preSelectedRegions']) {
        const newRegions = changes['preSelectedRegions'].currentValue;
        this.selectedRegions = Array.isArray(newRegions) ? [...newRegions] : [];
      }
      
      // Handle preSelectedCountries changes
      if (changes['preSelectedCountries']) {
        const newCountries = changes['preSelectedCountries'].currentValue;
        this.selectedCountries = Array.isArray(newCountries) ? [...newCountries] : [];
      }
      
      // Update display value after changes
      this.updateDisplayValue();
    }
  }

  loadRegions() {
    this.regionsService.getRegionsList().subscribe({
      next: (regions) => {
        this.regions = regions;
        this.filteredRegions = [...this.regions];

        // Build normalization caches
        this.regionNormById = new Map(this.regions.map((r) => [r.id, normalizeSearchText(r.name)]));
        this.countryNormById = new Map();
        for (const r of this.regions) {
          for (const c of r.countries) {
            this.countryNormById.set(c.id, normalizeSearchText(c.name));
          }
        }
        
        // Extract all countries for "onlyCountries" view
        if (this.displayMode === 'onlyCountries') {
          const flat = this.regions.reduce((acc, region) => {
            return [...acc, ...region.countries];
          }, [] as Country[]);
          this.allCountriesBase = flat;
          this.allCountries = [...flat];
        }
      },
      error: (error) => {
        console.error('Error loading regions:', error);
      }
    });
  }

  showDialog() {
    this.dialogVisible = true;
    this.searchQuery = '';
    this.filteredRegions = [...this.regions];
    this.currentNormQuery = '';
    
    // Reset filtered countries when in onlyCountries mode
    if (this.displayMode === 'onlyCountries') {
      if (!this.allCountriesBase.length && this.regions.length) {
        this.allCountriesBase = this.regions.reduce((acc, region) => {
          return [...acc, ...region.countries];
        }, [] as Country[]);
      }
      this.allCountries = [...this.allCountriesBase];
    }
  }

  /**
   * Checks if the entire region is selected
   */
  isRegionSelected(region: Continent): boolean {
    return this.selectedRegions.includes(region.id);
  }

  /**
   * Toggles the selection of an entire region
   */
  toggleSelectRegion(region: Continent, event: any) {
    // Get the checked state - either from a checkbox event or from the card click event
    let checked = event.target.checked;
    
    // If it's from the card click, we're passing the inverse of current selection state
    if (event.target.checked === undefined && event.target.type !== 'checkbox') {
      checked = !this.isRegionSelected(region);
    }
    
    if (checked) {
      if (!this.selectedRegions.includes(region.id)) {
        this.selectedRegions.push(region.id);
      }
      // Remove any individually selected countries from this region
      this.selectedCountries = this.selectedCountries.filter(countryId => !region.countries.some(c => c.id === countryId));
    } else {
      this.selectedRegions = this.selectedRegions.filter(id => id !== region.id);
    }
    this.updateDisplayValue();
  }

  /**
   * Checks if a specific country is selected
   */
  isCountrySelected(country: Country, region: Continent): boolean {
    return this.selectedCountries.includes(country.id) || this.selectedRegions.includes(region.id);
  }

  /**
   * Checks if a country is selected in the flat list view
   */
  isCountrySelectedFlat(country: Country): boolean {
    // Find the region the country belongs to
    const region = this.regions.find(r => r.countries.some(c => c.id === country.id));
    return this.selectedCountries.includes(country.id) || (region !== undefined && this.selectedRegions.includes(region.id));
  }

  /**
   * Toggles the selection of an individual country
   */
  toggleSelectCountry(region: Continent, country: Country, event: any) {
    const checked = event.target.checked;
    if (checked) {
      // Add country only if not already selected (prevent duplicates)
      if (!this.selectedCountries.includes(country.id)) {
        this.selectedCountries.push(country.id);
      }
      // If all countries in the region are selected, select the entire region
      const allSelected = region.countries.every(c => this.isCountrySelected(c, region));
      if (allSelected && !this.selectedRegions.includes(region.id)) {
        this.selectedRegions.push(region.id);
        // Remove individual selections as the entire region is selected
        this.selectedCountries = this.selectedCountries.filter(id => !region.countries.some(c => c.id === id));
      }
    } else {
      this.selectedCountries = this.selectedCountries.filter(id => id !== country.id);
      // If any country is deselected, ensure the region is not selected
      if (this.selectedRegions.includes(region.id)) {
        this.selectedRegions = this.selectedRegions.filter(id => id !== region.id);
      }
    }
    this.updateDisplayValue();
  }

  /**
   * Toggles selection of a country in the flat list view
   */
  toggleSelectCountryFlat(country: Country, event: any) {
    const checked = event.target.checked;
    const regionOfCountry = this.regions.find(r => r.countries.some(c => c.id === country.id));
    
    if (!regionOfCountry) return;
    
    if (checked) {
      // If the region is already selected, do nothing
      if (this.selectedRegions.includes(regionOfCountry.id)) {
        return;
      }
      
      // Add country only if not already selected (prevent duplicates)
      if (!this.selectedCountries.includes(country.id)) {
        this.selectedCountries.push(country.id);
      }
      
      // Check if all countries in this region are now selected
      const allRegionCountriesSelected = regionOfCountry.countries.every(c => 
        this.selectedCountries.includes(c.id)
      );
      
      if (allRegionCountriesSelected) {
        this.selectedRegions.push(regionOfCountry.id);
        // Remove individual selections as the entire region is selected
        this.selectedCountries = this.selectedCountries.filter(id => 
          !regionOfCountry.countries.some(c => c.id === id)
        );
      }
    } else {
      // If the region is selected, deselect it and select all other countries
      if (this.selectedRegions.includes(regionOfCountry.id)) {
        this.selectedRegions = this.selectedRegions.filter(id => id !== regionOfCountry.id);
        // Select all other countries in the region except this one (prevent duplicates)
        regionOfCountry.countries.forEach(c => {
          if (c.id !== country.id && !this.selectedCountries.includes(c.id)) {
            this.selectedCountries.push(c.id);
          }
        });
      } else {
        // Just remove this country from selection
        this.selectedCountries = this.selectedCountries.filter(id => id !== country.id);
      }
    }
    this.updateDisplayValue();
  }

  /**
   * Updates the display value shown in the input field
   */
  updateDisplayValue() {
    const selectedRegionNames = this.regions
      .filter(region => this.selectedRegions.includes(region.id))
      .map(region => region.name);

    const selectedCountryNames = this.regions
      .filter((region: any) => !this.selectedRegions.includes(region.id))
      .reduce((acc: string[], region: any) => {
        return acc.concat(
          region.countries
            .filter((c: any) => this.selectedCountries.includes(c.id))
            .map((c: any) => c.name)
        );
      }, []);

    this.displayValue = [...selectedRegionNames, ...selectedCountryNames].join(', ');
  }

  /**
   * Determines if there are any selections made
   */
  hasSelections(): boolean {
    return this.selectedRegions.length > 0 || this.selectedCountries.length > 0;
  }

  getCountryFlagPath(flag: string): string {
    try { 
      return `../../../assets/media/flags/${flag}.svg`;
    } catch {
      return `../../../assets/media/flags/default.svg`;
    }
  }

  onFlagError(event: any) {
    event.target.src = `../../../../assets/media/flags/default.svg`;
  }

  /**
   * Emits the selected regions and countries
   */
  onConfirm() {
    this.regionsSelected.emit({
      regions: this.selectedRegions,
      countries: this.selectedCountries
    });
    this.dialogVisible = false;
  }

  /**
   * Gets the selected display items for chips
   */
  getSelectedDisplayItems(): string[] {
    const selectedItems: string[] = [];
    
    this.regions.forEach(region => {
      if (this.selectedRegions.includes(region.id)) {
        // If region is selected, show region name
        selectedItems.push(region.name);
      } else {
        // Otherwise show selected country names
        const selectedCountries = region.countries.filter(country => 
          this.selectedCountries.includes(country.id)
        );
        
        if (selectedCountries.length > 0) {
          selectedItems.push(...selectedCountries.map(country => country.name));
        }
      }
    });

    return selectedItems;
  }

  /**
   * Filters regions and countries based on search query
   */
  filterRegions() {
    // Called on each input event; schedule debounced filtering instead of filtering synchronously.
    this.search$.next(this.searchQuery);
  }

  private applyFilter(rawQuery: string) {
    const q = normalizeSearchText(rawQuery);
    this.currentNormQuery = q;

    if (!q) {
      this.filteredRegions = [...this.regions];
      if (this.displayMode === 'onlyCountries') {
        this.allCountries = [...this.allCountriesBase];
      }
      return;
    }

    // Filter regions whose names match OR have matching countries
    this.filteredRegions = this.regions.filter((region) => {
      const rNorm = this.regionNormById.get(region.id) || normalizeSearchText(region.name);
      if (rNorm.includes(q)) return true;
      return region.countries.some((c) => (this.countryNormById.get(c.id) || normalizeSearchText(c.name)).includes(q));
    });

    if (this.displayMode === 'onlyCountries') {
      this.allCountries = this.allCountriesBase.filter((c) => (this.countryNormById.get(c.id) || normalizeSearchText(c.name)).includes(q));
    }
  }

  /**
   * Filters countries within a region based on search query
   */
  filteredCountries(region: Continent): Country[] {
    if (!this.currentNormQuery) {
      return region.countries;
    }
    const q = this.currentNormQuery;
    return region.countries.filter((country) =>
      (this.countryNormById.get(country.id) || normalizeSearchText(country.name)).includes(q)
    );
  }

  /**
   * Gets the total count of selected regions and countries
   */
  getSelectedCount(): number {
    let count = this.selectedRegions.length;
    
    // Count individually selected countries
    count += this.selectedCountries.length;
    
    return count;
  }

  /**
   * Removes a specific item (region or country) from selection
   */
  removeItem(itemName: string) {
    let itemRemoved = false;
    
    // Check if it's a region
    const region = this.regions.find(r => r.name === itemName);
    if (region) {
      this.selectedRegions = this.selectedRegions.filter(id => id !== region.id);
      itemRemoved = true;
    } else {
      // Check if it's a country
      for (const regionItem of this.regions) {
        const country = regionItem.countries.find(c => c.name === itemName);
        if (country) {
          this.selectedCountries = this.selectedCountries.filter(id => id !== country.id);
          itemRemoved = true;
          break;
        }
      }
    }
    
    // Update display value after removal
    this.updateDisplayValue();
    
    // Emit changes immediately after removal
    if (itemRemoved) {
      this.regionsSelected.emit({
        regions: this.selectedRegions,
        countries: this.selectedCountries
      });
    }
  }

  /**
   * Clear all selections and emit changes
   */
  clearAllSelections() {
    this.selectedRegions = [];
    this.selectedCountries = [];
    this.updateDisplayValue();
    
    // Emit the cleared state
    this.regionsSelected.emit({
      regions: this.selectedRegions,
      countries: this.selectedCountries
    });
  }
}
