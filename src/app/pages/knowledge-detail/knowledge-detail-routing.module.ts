import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { KnowledgeDetailsComponent } from './knowledge-details/knowledge-details.component';
import { OverviewComponent } from './knowledge-details/overview/overview.component';
import { ReviewsComponent } from './knowledge-details/reviews/reviews.component';
import { CommentsComponent } from './knowledge-details/comments/comments.component';
import { ViewMyKnowledgeComponent } from './knowledge-details/view-my-knowledge/view-my-knowledge.component';


const routes: Routes = [
  {
    path: "detail/:id",
    component: KnowledgeDetailsComponent,
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full'
      },
      {
        path: 'overview',
        component: OverviewComponent
      },
      {
        path: 'reviews',
        component: ReviewsComponent
      },
      {
        path: 'comments',
        component: CommentsComponent
      }
    ]
  },
  {
    path:'view-my-knowledge/:id',
    component:ViewMyKnowledgeComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class KnowledgeDetailRoutingModule { }
