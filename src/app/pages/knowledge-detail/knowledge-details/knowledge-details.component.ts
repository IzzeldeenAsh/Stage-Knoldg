import { Component, Injector, OnInit } from '@angular/core';
import { Params } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { BaseComponent } from 'src/app/modules/base.component';
import { KnowledgeService, Knowledge } from 'src/app/_fake/services/knowledge/knowledge.service';
import { DocumentListResponse } from 'src/app/_fake/services/add-insight-steps/add-insight-steps.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-knowledge-details',
  templateUrl: './knowledge-details.component.html',
  styleUrl: './knowledge-details.component.scss'
})
export class KnowledgeDetailsComponent extends BaseComponent implements OnInit {
  knowledgeId: string;
  knowledge: Knowledge;
  documents: DocumentListResponse;
  isLoading: boolean = false;

  constructor(
    injector: Injector,
    private route: ActivatedRoute,
    private knowledgeService: KnowledgeService
  ) {
    super(injector);
  }

  ngOnInit(): void {
    const paramsSubscription = this.route.params.subscribe((params: Params) => {
      this.knowledgeId = params['id'];
      if (this.knowledgeId) {
        this.loadKnowledgeData();
      }
    });
    this.unsubscribe.push(paramsSubscription);
  }

  private loadKnowledgeData(): void {
    this.isLoading = true;
    const knowledgeSubscription = forkJoin({
      knowledge: this.knowledgeService.getKnowledgeById(Number(this.knowledgeId)),
      documents: this.knowledgeService.getListDocumentsInfo(Number(this.knowledgeId))
    }).subscribe({
      next: (response) => {
        this.knowledge = response.knowledge.data;
        this.documents = response.documents;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading knowledge data:', error);
        this.isLoading = false;
      }
    });
    this.unsubscribe.push(knowledgeSubscription);
  }
}
