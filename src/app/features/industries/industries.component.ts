import { Component, OnInit } from '@angular/core';
import { Industry } from '../../shared/interfaces/industry.interface';
import { IndustriesService } from './services/industries.service';
import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-industries',
  template: `
    <div class="industries-container">
      <h1>All Industries</h1>
      <div class="industries-grid">
        <app-industry-card
          *ngFor="let industry of industries"
          [industry]="industry"
        ></app-industry-card>
      </div>
    </div>
  `,
  styles: [`
    .industries-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      text-align: center;
      margin-bottom: 32px;
      color: #333;
    }

    .industries-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
      justify-items: center;
    }
  `]
})
export class IndustriesComponent implements OnInit {
  industries: Industry[] = [];

  constructor(
    private industriesService: IndustriesService,
    private meta: Meta,
    private title: Title
  ) {}

  ngOnInit(): void {
    // Set SEO meta tags
    this.title.setTitle('All Industries | Foresighta');
    this.meta.updateTag({ name: 'description', content: 'Explore our comprehensive list of industries and their sub-sectors. Find detailed information about various business sectors and their specific domains.' });
    this.meta.updateTag({ name: 'keywords', content: 'industries, business sectors, sub-industries, technology, healthcare, manufacturing' });

    // Load industries
    this.industriesService.getIndustries().subscribe(
      industries => this.industries = industries
    );
  }
}
