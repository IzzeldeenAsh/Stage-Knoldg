import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MainPageRoutingModule } from './main-page-routing.module';
import { HomeSearchEngineComponent } from './home-search-engine/home-search-engine.component';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { TranslationModule } from '../i18n/translation.module';
import { FormsModule } from '@angular/forms';
import { HomeNavbarComponent } from './home-navbar/home-navbar.component';
import { LanguageSwitchModule } from 'src/app/reusable-components/language-switch/language-switch.module';
import { DropdownModule } from 'primeng/dropdown';

@NgModule({
  declarations: [HomeSearchEngineComponent,HomeNavbarComponent],
  imports: [
    CommonModule,
    MainPageRoutingModule,
    InlineSVGModule,
    DropdownModule,
    LanguageSwitchModule,
    FormsModule,
    TranslationModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]  // Add this line
})
export class MainPageModule { }
