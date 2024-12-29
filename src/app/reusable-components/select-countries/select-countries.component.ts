import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CountriesService, Country } from 'src/app/_fake/services/countries/countries.service';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { MultiSelectModule } from 'primeng/multiselect';
import { CommonModule } from '@angular/common';
import { TruncateTextPipe } from 'src/app/pipes/truncate-pipe/truncate-text.pipe';

@Component({
  selector: 'app-select-countries',
  templateUrl: './select-countries.component.html',
  styleUrls: ['./select-countries.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MultiSelectModule,
    TruncateTextPipe
  ]
})
export class SelectCountriesComponent implements OnInit {
  countries: Country[] = [];
  selectedCountries: Country[] = [];
  loading$: Observable<boolean>;

  @Output() countriesSelected = new EventEmitter<Country[]>();

  countryControl: FormControl = new FormControl([]);

  constructor(private countriesService: CountriesService) {
    this.loading$ = this.countriesService.isLoading$;
    this.countryControl.valueChanges.subscribe((selected: Country[]) => {
      this.selectedCountries = selected;
      this.countriesSelected.emit(this.selectedCountries);
    });
  }

  ngOnInit(): void {
    this.fetchCountries();
  }

  fetchCountries(): void {
    this.countriesService.getCountries().subscribe({
      next: (data: Country[]) => {
        this.countries = data;
      },
      error: (error) => {
        console.error('Error fetching countries:', error);
      }
    });
  }

  getCountryFlagPath(flag: string): string {
    return `../../../assets/media/flags/${flag}.svg`;
  }

  onFlagError(event: any): void {
    event.target.src = `../../../assets/media/flags/default.svg`;
  }

  emitSelectedCountries(): void {
    this.countriesSelected.emit(this.selectedCountries);
  }
}
