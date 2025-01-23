import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { KnowledgeService, Knowledge } from 'src/app/_fake/services/knowledge/knowledge.service';

@Component({
  selector: 'app-scheduled',
  templateUrl: './scheduled.component.html',
})
export class ScheduledComponent implements OnInit {
  knowledges: Knowledge[] = [];
  currentPage: number = 1;
  totalPages: number = 1;
  totalItems: number = 0;

  constructor(
    private knowledgeService: KnowledgeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPage(1);
  }

  loadPage(page: number): void {
    this.knowledgeService.getPaginatedKnowledges(page, 'scheduled').subscribe(
      (response) => {
        this.knowledges = response.data;
        this.currentPage = response.meta.current_page;
        this.totalPages = response.meta.last_page;
        this.totalItems = response.meta.total;
      }
    );
  }

  getPages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  deleteKnowledge(knowledge: Knowledge): void {
    if (confirm('Are you sure you want to delete this knowledge?')) {
      this.knowledgeService.deleteKnowledge(knowledge.id).subscribe(
        () => {
          this.loadPage(this.currentPage);
        }
      );
    }
  }

  publishKnowledge(knowledgeId: number): void {
    this.knowledgeService.setKnowledgeStatus(knowledgeId, 'published', new Date().toISOString()).subscribe(
      () => {
        this.loadPage(this.currentPage);
      }
    );
  }

  editKnowledge(knowledgeId: number): void {
    this.router.navigate(['/']);
  }
} 