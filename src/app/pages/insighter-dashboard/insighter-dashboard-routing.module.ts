import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InsighterDashboardComponent } from './insighter-dashboard/insighter-dashboard.component';
import { MyDashboardComponent } from './insighter-dashboard/my-dashboard/my-dashboard.component';
import { MyRequestsComponent } from './insighter-dashboard/my-requests/my-requests.component';
import { MyKnowledgeComponent } from './insighter-dashboard/my-knowledge/my-knowledge.component';
import { AccountSettingsComponent } from './insighter-dashboard/account-settings/account-settings.component';
import { RolesGuard } from 'src/app/guards/roles-guard/roles-gurad.gurad';
import { UpgradeToCompanyComponent } from './insighter-dashboard/account-settings/upgrade-to-company/upgrade-to-company.component';
import { GeneralSettingsComponent } from './insighter-dashboard/account-settings/general-settings/general-settings.component';

const routes: Routes = [
  {
    path: '',
    component: InsighterDashboardComponent,
    children: [
      {
        path: '',
        redirectTo: 'my-dashboard',
        pathMatch: 'full'
      },
      {
        path: 'my-dashboard',
        component: MyDashboardComponent
      },
      {
        path: 'my-requests',
        component: MyRequestsComponent
      },
      {
        path: 'my-knowledge',
        component: MyKnowledgeComponent
      },
      {
        path: 'account-settings',
        component: AccountSettingsComponent,
        children: [
          {
            path:'',
            redirectTo:'general-settings',
            pathMatch:'full'
          },
          {
            path:'company-account',
            component:UpgradeToCompanyComponent,
            canActivate:[RolesGuard],
            data: { roles: ['insighter'] } 
          },
          {
            path:'general-settings',
            component:GeneralSettingsComponent,
          }
        ]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InsighterDashboardRoutingModule { }
