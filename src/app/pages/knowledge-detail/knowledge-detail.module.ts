import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { KnowledgeDetailRoutingModule } from './knowledge-detail-routing.module';
import { KnowledgeDetailsComponent } from './knowledge-details/knowledge-details.component';
import { ToastModule } from 'primeng/toast';
import { CommentsComponent } from './knowledge-details/comments/comments.component';
import { OverviewComponent } from './knowledge-details/overview/overview.component';
import { ReviewsComponent } from './knowledge-details/reviews/reviews.component';
import { FileSizePipe } from 'src/app/pipes/file-size-pipe/file-size.pipe';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { RelatedKnowledgesComponent } from './knowledge-details/related-knowledges/related-knowledges.component';


@NgModule({
  declarations: [
    KnowledgeDetailsComponent,
    OverviewComponent,
    ReviewsComponent,
    CommentsComponent,
    RelatedKnowledgesComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ToastModule,
    NgbTooltipModule,
    FileSizePipe,
    KnowledgeDetailRoutingModule
  ]
})
export class KnowledgeDetailModule { }
