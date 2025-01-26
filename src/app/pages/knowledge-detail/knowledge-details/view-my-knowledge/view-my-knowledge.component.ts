import { Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Knowledge, KnowledgeService } from 'src/app/_fake/services/knowledge/knowledge.service';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-view-my-knowledge',
  templateUrl: './view-my-knowledge.component.html',
  styleUrls: ['./view-my-knowledge.component.scss']
})
export class ViewMyKnowledgeComponent extends BaseComponent implements OnInit {
  knowledge: Knowledge;
  documents: any[] = [];
  lang: string = 'en';
  isLoading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private knowledgeService: KnowledgeService,
    injector: Injector
  ) {
   super(injector);
  }

  ngOnInit() {
    this.isLoading = true;
    // Step 1: Get knowledge ID from route params
    this.route.params.pipe(
      // Step 2: Get knowledge info
      switchMap(params => this.knowledgeService.getKnowledgeById(params['id'])),
      // Step 3: Get knowledge files info
      switchMap(knowledgeResponse => {
        this.knowledge = knowledgeResponse.data;
        return this.knowledgeService.getListDocumentsInfo(this.knowledge.id);
      }),
      // Step 4: Get document URLs for each document
      switchMap(documentsResponse => {
        const documents = documentsResponse.data;
        const documentUrlRequests = documents.map(doc => 
          this.knowledgeService.getDocumentUrl(doc.id).pipe(
            map(urlResponse => ({
              ...doc,
              url: urlResponse.data.url
            }))
          )
        );
        return forkJoin(documentUrlRequests);
      })
    ).subscribe({
      next: (documentsWithUrls) => {
        this.documents = documentsWithUrls;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading knowledge:', error);
        this.isLoading = false;
      }
    });


  }
}
