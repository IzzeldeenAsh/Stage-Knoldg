import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-comments',
  templateUrl: './comments.component.html',
})
export class CommentsComponent implements OnInit {
  knowledgeId: string;

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    // Get the ID from the parent route
    this.route.parent?.params.subscribe(params => {
      this.knowledgeId = params['id'];
    });
  }
} 