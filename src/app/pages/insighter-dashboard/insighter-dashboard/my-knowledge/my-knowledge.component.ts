import { Component, OnInit } from '@angular/core';
import { KnowledgeService } from 'src/app/_fake/services/knowledge/knowledge.service';

@Component({
  selector: 'app-my-knowledge',
  templateUrl: './my-knowledge.component.html',
  styleUrl: './my-knowledge.component.scss'
})
export class MyKnowledgeComponent implements OnInit {
  hasKnowledge: boolean = true;
  loading: boolean = true;

  constructor(private knowledgeService: KnowledgeService) {}

  ngOnInit() {
    this.checkForKnowledge();
  }

  private checkForKnowledge() {
    this.loading = true;
    this.knowledgeService.getListKnowledge().subscribe(
      (response) => {
        this.hasKnowledge = response.data && response.data.length > 0;
        this.loading = false;
      },
      (error) => {
        console.error('Error checking for knowledge:', error);
        this.hasKnowledge = false;
        this.loading = false;
      }
    );
  }
}
