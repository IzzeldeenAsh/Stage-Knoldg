import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MainPageRoutingModule } from './main-page-routing.module';
import { MainComponent } from './main.component';
import { DropdownModule } from 'primeng/dropdown';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { ResultsPageComponent } from './results-page/results-page.component';
import { FormsModule } from '@angular/forms';
import { InsighterCardComponent } from './results-page/insighter-card/insighter-card.component';


@NgModule({
  declarations: [MainComponent,ResultsPageComponent,InsighterCardComponent],
  imports: [
    CommonModule,
    MainPageRoutingModule,
    FormsModule,
    DropdownModule,
    InlineSVGModule,
  ]
})
export class MainPageModule { }
