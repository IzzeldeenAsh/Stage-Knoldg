import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { IndustriesComponent } from './industries.component';
import { IndustryCardComponent } from './components/industry-card/industry-card.component';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';

const routes: Routes = [
  {
    path: '',
    component: IndustriesComponent,
  }
];

@NgModule({
  declarations: [
    IndustriesComponent,
    IndustryCardComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    MatCardModule,
    MatButtonModule,
    MatGridListModule
  ]
})
export class IndustriesModule { }
