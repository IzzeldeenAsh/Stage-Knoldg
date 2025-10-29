import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-review-knowledge-analytics',
  templateUrl: './review-knowledge-analytics.component.html',
  styleUrls: ['./review-knowledge-analytics.component.scss']
})
export class ReviewKnowledgeAnalyticsComponent implements OnInit {
  knowledgeId: number;
  
  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Get the knowledge ID from the parent route
    this.route.parent?.params.subscribe(params => {
      this.knowledgeId = +params['id'];
    });
  }
} 