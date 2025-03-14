import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MyDashboardComponent } from './my-dashboard.component';
import { TranslationModule } from 'src/app/modules/i18n';
import { KnowledgeTypesStatisticsComponent } from './knowledge-types-statistics/knowledge-types-statistics.component';
import { NgApexchartsModule } from 'ng-apexcharts';

const routes: Routes = [
  {
    path: '',
    component: MyDashboardComponent
  }
];

@NgModule({
  declarations: [
    MyDashboardComponent,
    KnowledgeTypesStatisticsComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TranslationModule,
    NgApexchartsModule
  ],
  schemas: [NO_ERRORS_SCHEMA]
})
export class MyDashboardModule { } 