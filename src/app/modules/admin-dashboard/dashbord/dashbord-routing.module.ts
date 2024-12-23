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
import { VerificationQuestionsListComponent } from './dashboard/verification-questions-list/verification-questions-list.component';


const routes: Routes = [
  {
    path:'',
    redirectTo:'main-dashboard',
    pathMatch:'full'
  },
  {
    path:'main-dashboard',
    component:DashboardComponent,
    children:[
      {
        path:'',
        redirectTo:'requests',
        pathMatch:'full'
      },
      {
        path:'requests',
        component:RequestsListComponent
      },
      {
        path:'departments',
        component:DepartmentComponent
      },
      {
        path:'positions',
        component:PositionsComponent
      },
      {
        path:'countries',
        component:CountriesComponent
      },
      {
        path:'guidelines',
        component:GuidelineComponent,
      },
      {
        path:'topics',
        component:TopicsComponent,
      },
      {
        path:'regions',
        component:RegionsComponent
      },
      {
        path:'consulting-fields',
        component:ConsultingFieldsComponent
      },
      {
        path:'co-settings',
        component:CompanySettingsComponent
      },
      {
        path:'ISIC-code',
        component:ISICCodeManagmentComponent
      },
      {
        path:'industries',
        component:IndustriesComponent
      },
      {
        path:'tags',
        component:TagsComponent,
      }
      ,
      {
        path:'hscode',
        component:HSCodeComponent,
      },
      {
        path:'verification-questions',
        component:VerificationQuestionsListComponent,
      }
    ]
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashbordRoutingModule { }
