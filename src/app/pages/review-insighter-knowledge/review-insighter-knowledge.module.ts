import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ToastModule } from 'primeng/toast';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { MenuModule } from 'primeng/menu';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { ReviewInsighterKnowledgeRoutingModule } from './review-insighter-knowledge-routing.module';
import { ReviewInsighterKnowledgeComponent } from './review-insighter-knowledge.component';
import { ReviewKnowledgeDetailsComponent } from './review-knowledge-details/review-knowledge-details.component';
import { ReviewKnowledgeAnalyticsComponent } from './review-knowledge-analytics/review-knowledge-analytics.component';
import { FileSizePipe } from 'src/app/reusable-components/file-uploader/file-size.pipe';

@NgModule({
  declarations: [
    ReviewInsighterKnowledgeComponent,
    ReviewKnowledgeDetailsComponent,
    ReviewKnowledgeAnalyticsComponent
  ],
  imports: [
    CommonModule,
    ReviewInsighterKnowledgeRoutingModule,
    FormsModule,
    ToastModule,
    TranslateModule,
    SharedModule,
    FileSizePipe,
    FormsModule,
    ReactiveFormsModule,
    NgbTooltipModule,
    MenuModule,
    InputTextareaModule,
    ButtonModule
  ]
})
export class ReviewInsighterKnowledgeModule { } 