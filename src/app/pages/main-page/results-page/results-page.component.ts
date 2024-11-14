import { Component, OnInit } from '@angular/core';
import countriesData from 'src/app/_metronic/shared/countires.json';
@Component({
  selector: 'app-results-page',
  templateUrl: './results-page.component.html',
  styleUrl: './results-page.component.scss'
})
export class ResultsPageComponent   implements OnInit {
  countries: any[] = [];
  value:any;
  selectedCountry: any;
  ngOnInit(): void {
    this.countries = countriesData.countriesLocalAPI;
  }
  isAdvancedSearchVisible: boolean = true;

  // Method to toggle the advanced search form visibility
  toggleAdvancedSearch(): void {
    this.isAdvancedSearchVisible = !this.isAdvancedSearchVisible;
 
  }
  selectedType: string = 'list'; // Default value

  onTypeChange(event: Event): void {
    const inputElement = event.target as HTMLInputElement;
    this.selectedType = inputElement.value; // Update the selected value
  }
}
