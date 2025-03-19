import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
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
export class SelectRegionComponent implements OnInit {
  @Input() placeholder: string = 'Select Region...';
  @Input() title: string = 'Select Regions';
  @Input() preSelectedRegions: any = [];
  @Input() preSelectedCountries: any = [];
  @Output() regionsSelected = new EventEmitter<{ regions: number[], countries: number[] }>();

  dialogVisible: boolean = false;
  regions: Continent[] = [];
  filteredRegions: Continent[] = [];
  selectedRegions: number[] = [];
  selectedCountries: number[] = [];
  displayValue: string = '';
  searchQuery: string = '';

  constructor(private regionsService: RegionsService) {}

  ngOnInit() {
    this.loadRegions();
    this.selectedRegions = this.preSelectedRegions ? [...this.preSelectedRegions] : [];
    this.selectedCountries = this.preSelectedCountries ? [...this.preSelectedCountries] : [];
    this.updateDisplayValue();
  }

  loadRegions() {
    this.regionsService.getRegionsList().subscribe({
      next: (regions) => {
        this.regions = regions;
        this.filteredRegions = [...this.regions];
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
    const checked = event.target.checked;
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
   * Toggles the selection of an individual country
   */
  toggleSelectCountry(region: Continent, country: Country, event: any) {
    const checked = event.target.checked;
    if (checked) {
      this.selectedCountries.push(country.id);
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
      const selectedCountries = region.countries.filter(country => 
        this.isCountrySelected(country, region)
      );
      
      if (selectedCountries.length === region.countries.length) {
        // If all countries in a region are selected, show region name
        selectedItems.push(region.name);
      } else if (selectedCountries.length > 0) {
        // Otherwise show selected country names
        selectedItems.push(...selectedCountries.map(country => country.name));
      }
    });

    return selectedItems;
  }

  /**
   * Filters regions and countries based on search query
   */
  filterRegions() {
    if (!this.searchQuery || this.searchQuery.trim() === '') {
      this.filteredRegions = [...this.regions];
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    
    // Filter regions whose names match the query
    this.filteredRegions = this.regions.filter(region => 
      region.name.toLowerCase().includes(query) || 
      region.countries.some(country => country.name.toLowerCase().includes(query))
    );
  }

  /**
   * Filters countries within a region based on search query
   */
  filteredCountries(region: Continent): Country[] {
    if (!this.searchQuery || this.searchQuery.trim() === '') {
      return region.countries;
    }

    const query = this.searchQuery.toLowerCase().trim();
    return region.countries.filter(country => 
      country.name.toLowerCase().includes(query)
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
   * Clears all selections
   */
  clearAllSelections() {
    this.selectedRegions = [];
    this.selectedCountries = [];
    this.updateDisplayValue();
  }

  /**
   * Removes a specific item (region or country) from selection
   */
  removeItem(itemName: string) {
    // Check if it's a region
    const region = this.regions.find(r => r.name === itemName);
    if (region) {
      this.selectedRegions = this.selectedRegions.filter(id => id !== region.id);
      this.updateDisplayValue();
      return;
    }

    // Check if it's a country
    for (const region of this.regions) {
      const country = region.countries.find(c => c.name === itemName);
      if (country) {
        this.selectedCountries = this.selectedCountries.filter(id => id !== country.id);
        this.updateDisplayValue();
        return;
      }
    }
  }
}
