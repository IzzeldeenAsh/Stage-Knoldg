import { NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MyDashboardComponent } from './my-dashboard.component';
import { TranslationModule } from 'src/app/modules/i18n';
import { KnowledgeTypesStatisticsComponent } from './knowledge-types-statistics/knowledge-types-statistics.component';
import { EmployeeKnowledgeStatisticsComponent } from './employee-knowledge-statistics/employee-knowledge-statistics.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DonutEmployeeChartComponent } from './donut-employee-chart/donut-employee-chart.component';

const routes: Routes = [
  {
    path: '',
    component: MyDashboardComponent
  }
];

@NgModule({
  declarations: [
    MyDashboardComponent,
    KnowledgeTypesStatisticsComponent,
    EmployeeKnowledgeStatisticsComponent,
    DonutEmployeeChartComponent
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