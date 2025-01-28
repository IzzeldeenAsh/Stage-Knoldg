import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MyKnowledgeBaseRoutingModule } from './my-knowledge-base-routing.module';
import { ViewMyKnowledgeComponent } from './view-my-knowledge/view-my-knowledge.component';
import { ToastModule } from 'primeng/toast';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { KnowledgeDetailsComponent } from './view-my-knowledge/knowledge-details/knowledge-details.component'
import { KnowledgeAnalyticsComponent } from './view-my-knowledge/knowledge-analytics/knowledge-analytics.component';
import { FileSizePipe } from 'src/app/reusable-components/file-uploader/file-size.pipe';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';


@NgModule({
  declarations: [ViewMyKnowledgeComponent, KnowledgeDetailsComponent, KnowledgeAnalyticsComponent],
  imports: [
    CommonModule,
    MyKnowledgeBaseRoutingModule,
    ToastModule,
    NgbTooltipModule,
    SharedModule,
    FileSizePipe
  ]
})
export class MyKnowledgeBaseModule { }

