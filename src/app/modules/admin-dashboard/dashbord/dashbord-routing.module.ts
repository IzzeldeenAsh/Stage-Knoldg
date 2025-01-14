import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CompanySettingsComponent } from './company-settings/company-settings.component';
import { DepartmentComponent } from './dashboard/departments/departments.component';
import { PositionsComponent } from './dashboard/positions/positions.component';
import { CountriesComponent } from './dashboard/countries/countries.component';
import { RegionsComponent } from './dashboard/regions/regions.component';
import { ConsultingFieldsComponent } from './dashboard/consulting-fields/consulting-fields.component';
import { ISICCodeManagmentComponent } from './dashboard/isic-code-managment/isic-code-managment.component';
import { TagsComponent } from './dashboard/tags/tags.component';
import { HSCodeComponent } from './hscode/hscode.component';
import { GuidelineComponent } from './dashboard/guidelines/guidelines.component';
import { TopicsComponent } from './dashboard/topics/topics.component';
import { IndustriesComponent } from './dashboard/industries/industries.component';
import { RequestsListComponent } from './dashboard/requests-list/requests-list.component';
import { EconomicBlocksComponent } from './dashboard/economic-blocks/economic-blocks.component';
import { VerificationQuestionsListComponent } from './dashboard/verification-questions-list/verification-questions-list.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      { path: 'main-dashboard/requests', component: RequestsListComponent },
      { path: 'main-dashboard/departments', component: DepartmentComponent },
      { path: 'main-dashboard/verification-questions', component: VerificationQuestionsListComponent },
      { path: 'main-dashboard/positions', component: PositionsComponent },
      { path: 'main-dashboard/countries', component: CountriesComponent },
      { path: 'main-dashboard/regions', component: RegionsComponent },
      { path: 'main-dashboard/consulting-fields', component: ConsultingFieldsComponent },
      { path: 'main-dashboard/ISIC-code', component: ISICCodeManagmentComponent },
      { path: 'main-dashboard/industries', component: IndustriesComponent },
      { path: 'main-dashboard/hscode', component: HSCodeComponent },
      { path: 'main-dashboard/guidelines', component: GuidelineComponent },
      { path: 'main-dashboard/economic-blocks', component: EconomicBlocksComponent },
      { path: '', redirectTo: 'main-dashboard/requests', pathMatch: 'full' },
    ],
  },
  {
    path: 'topics',
    component: TopicsComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashbordRoutingModule { }
