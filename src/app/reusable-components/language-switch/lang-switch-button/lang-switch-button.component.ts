import { Component, OnInit } from '@angular/core';

import { FontService } from 'src/app/_fake/services/font-change/font.service';
import { TranslationService } from 'src/app/modules/i18n/translation.service';

@Component({
  selector: 'app-lang-switch-button',
  templateUrl: './lang-switch-button.component.html',
  styleUrls: ['./lang-switch-button.component.scss']
})
export class LangSwitchButtonComponent implements OnInit {
  selectedLang = 'en'; // Default language
  isMenuVisible = false;
  selectedFlag = '../../../../assets/media/flags/united-states.svg'; // Default flag
  
  constructor(
    private translationService: TranslationService,
    private fontService: FontService // Inject the FontService
  ) {}

  ngOnInit(): void {
    // Get the selected language from the translation service
    this.selectedLang = this.translationService.getSelectedLanguage();
    
    // Update flag and font based on the language
    this.updateFlag();
    this.fontService.updateFont(this.selectedLang);
  }

  toggleMenu(): void {
    this.isMenuVisible = !this.isMenuVisible;
  }

  changeLanguage(lang: string): void {
    // Change the language in the app
    this.selectedLang = lang;
    this.translationService.setLanguage(lang);
    
    // Update the flag and font based on the new language
    this.updateFlag();
    this.fontService.updateFont(this.selectedLang);

    // Hide the menu after the language is selected
    this.isMenuVisible = false;
  }

  updateFlag(): void {
    // Update the flag based on the selected language
    this.selectedFlag = this.selectedLang === 'ar'
      ? '../../../../assets/media/flags/saudi-arabia.svg'
      : '../../../../assets/media/flags/uk.svg';
  }
}