import { Component, OnInit } from '@angular/core';
import countriesData from 'src/app/_metronic/shared/countires.json';
@Component({
  selector: 'app-search-head',
  templateUrl: './search-head.component.html',
  styleUrl: './search-head.component.scss'
})
export class SearchHeadComponent implements OnInit {
  countries: any[] = [];
  value:any;
  selectedCountry: any;
  ngOnInit(): void {
    this.countries = countriesData.countriesLocalAPI;
  }
}
