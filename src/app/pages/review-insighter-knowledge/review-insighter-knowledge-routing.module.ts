import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CompanyGuard } from 'src/app/guards/company-guard/company.guard';
import { ReviewInsighterKnowledgeComponent } from './review-insighter-knowledge.component';
import { ReviewKnowledgeAnalyticsComponent } from './review-knowledge-analytics/review-knowledge-analytics.component';
import { ReviewKnowledgeDetailsComponent } from './review-knowledge-details/review-knowledge-details.component';
import { RolesGuard } from 'src/app/guards/roles-guard/roles-gurad.gurad';

const routes: Routes = [
  {
    path: 'review/:id',
    component: ReviewInsighterKnowledgeComponent,
    data: {
      breadcrumb: [
        { label: 'Company Dashboard', link: '/app/insighter-dashboard/my-company' },
        { label: 'Review Knowledge', link: '' }
      ]
    },
    children: [
      { path: '', redirectTo: 'details', pathMatch: 'full' },
      { path: 'details', component: ReviewKnowledgeDetailsComponent },
      { path: 'analytics', component: ReviewKnowledgeAnalyticsComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReviewInsighterKnowledgeRoutingModule { } 