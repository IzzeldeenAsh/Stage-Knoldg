import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InsighterDashboardComponent } from './insighter-dashboard/insighter-dashboard.component';
import { RolesGuard } from 'src/app/guards/roles-guard/roles-gurad.gurad';

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
        loadChildren: () => import('./insighter-dashboard/my-dashboard/my-dashboard.module').then(m => m.MyDashboardModule)
      },
      {
        path: 'my-requests',
        loadChildren: () => import('./insighter-dashboard/my-requests/my-requests.module').then(m => m.MyRequestsModule)
      },
      {
        path: 'my-knowledge',
        loadChildren: () => import('./insighter-dashboard/my-knowledge/my-knowledge.module').then(m => m.MyKnowledgeModule)
      },
      {
        path: 'my-downloads',
        loadChildren: () => import('./insighter-dashboard/my-downloads/my-downloads.module').then(m => m.MyDownloadsModule)
      },
      {
        path: 'my-consulting-schedule',
        loadChildren: () => import('./insighter-dashboard/my-consulting-schedule/my-consulting-schedule.module').then(m => m.MyConsultingScheduleModule)
      },
      {
        path: 'account-settings',
        loadChildren: () => import('./insighter-dashboard/account-settings/account-settings.module').then(m => m.AccountSettingsModule)
      },
      {
        path: 'my-company-settings',
        loadChildren: () => import('./insighter-dashboard/my-company/my-company.module').then(m => m.MyCompanyModule),
        canActivate: [RolesGuard],
        data: { roles: ['company'] }
      }
    
    
    ]
  }
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InsighterDashboardRoutingModule { }
