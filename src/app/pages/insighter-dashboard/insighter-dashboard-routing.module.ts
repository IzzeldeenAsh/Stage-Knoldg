import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InsighterDashboardComponent } from './insighter-dashboard/insighter-dashboard.component';

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
        path: 'account-settings',
        loadChildren: () => import('./insighter-dashboard/account-settings/account-settings.module').then(m => m.AccountSettingsModule)
      },
    
    ]
  }
  
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InsighterDashboardRoutingModule { }
