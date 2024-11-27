import { Component, Input, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { IForsightaProfile } from 'src/app/_fake/models/profile.interface';
import {  TranslationService } from 'src/app/modules/i18n';

@Component({
  selector: 'app-navigation-tabs',
  templateUrl: './navigation-tabs.component.html',
  styleUrl: './navigation-tabs.component.scss'
})
export class NavigationTabsComponent implements OnInit  {
  @Input() profile:IForsightaProfile;
  protected unsubscribe: Subscription[] = [];
  lang:string='en';
  tabs = [
    { labelen: 'Overview', labelar:'ملخص', link: '/app/profile/overview', activeInfo: true, activePrimary: false },
    { labelen: 'Settings',labelar:'الإعدادات', link: '/app/profile/settings', activeInfo: false, activePrimary: true },
  ];
  constructor(private translationService:TranslationService) {

  }
  ngOnInit(): void {
   this.handleLanguage()
  }
handleLanguage() {
  this.lang = this.translationService.getSelectedLanguage();
  const onLanguageSub = this.translationService.onLanguageChange().subscribe((lang) => {
    this.lang = lang;
    console.log("LangChanged");
  });
  this.unsubscribe.push(onLanguageSub);
}
ngOnDestroy(): void {
  this.unsubscribe.forEach((sb) => sb.unsubscribe());
}
}
