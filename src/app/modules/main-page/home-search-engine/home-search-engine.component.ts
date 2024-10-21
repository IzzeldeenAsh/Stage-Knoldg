import { Component, OnInit } from '@angular/core';
import { TranslationService } from '../../i18n/translation.service';
import { register } from 'swiper/element';
import countriesData from 'src/app/_metronic/shared/countires.json';
import { IsicService } from 'src/app/_fake/services/isic/isic.service';
@Component({
  selector: 'app-home-search-engine',
  templateUrl: './home-search-engine.component.html',
  styleUrl: './home-search-engine.component.scss'
})
export class HomeSearchEngineComponent   implements OnInit {
  isNavOpen = false;
  items = [
    { label: 'HOME.DISCOVER', active: true },
    { label: 'HOME.AGILE_ORGANIZATIONS', active: false },
    { label: 'HOME.BUSINESS_RESILIENCE', active: false },
    { label: 'HOME.CLIMATE_CHANGE', active: false },
    { label: 'HOME.QUANTUM_COMPUTING', active: false },
    { label: 'HOME.SAUDI_ARABIA_DATES', active: false },
    { label: 'HOME.SAUDI_ARABIA_DATES', active: false },
  ];
  selectedLang:string ='en'
  mobileSidebar:boolean=false;
  countries: any[] = [];
  selectedCountry: any;
  constructor(private translationService: TranslationService) {
    this.selectedLang = this.translationService.getSelectedLanguage()
  }
  ngOnInit(): void {
    this.countries = countriesData.countriesLocalAPI;
 
  }

  changeLanguage(event: Event) {
    const selectedLanguage = (event.target as HTMLSelectElement).value;
    this.translationService.setLanguage(selectedLanguage);
  }
  toggleNav() {
    this.isNavOpen = !this.isNavOpen;
  }

  toggleMobileSidebar(){
    this.mobileSidebar = !this.mobileSidebar
  }
  swiper: any;
  ngAfterViewInit() {
    register(); // Register Swiper custom elements

    const swiperEl = document.querySelector('swiper-container');
    this.swiper = swiperEl?.swiper;

    document.querySelector('.custom-prev')?.addEventListener('click', () => {
      this.swiper.slidePrev();
    });

    document.querySelector('.custom-next')?.addEventListener('click', () => {
      this.swiper.slideNext();
    });
  }
}
