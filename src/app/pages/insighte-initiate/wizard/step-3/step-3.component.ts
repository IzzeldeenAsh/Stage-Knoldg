import { Component, Injector, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BaseComponent } from 'src/app/modules/base.component';

interface Card {
  title: string;
  type: string;
  typeColor: string;
  description: string;
  price: string;
  image: string;
  selected: boolean;
}

@Component({
  selector: 'app-step-3',
  templateUrl: './step-3.component.html',
  styleUrls: ['./step-3.component.scss'],
})
export class Step3Component extends BaseComponent implements OnInit {
  constructor(injector: Injector) {
    super(injector);
  }

  ngOnInit(): void {}

  cards: Card[] = [
    {
      title: 'Market Analysis Report',
      type: 'PPTX',
      typeColor: 'danger',
      description: 'Comprehensive market analysis with key trends and competitive landscape',
      price: '$12',
      image: '/static/metronic/tailwind/dist/assets/media/images/2600x1200/3-dark.png',
      selected: false,
    },
    {
      title: 'Industry Overview',
      type: 'DOCX', 
      typeColor: 'info',
      description: 'Detailed overview of industry segments, drivers and challenges',
      price: '$25',
      image: '/static/metronic/tailwind/dist/assets/media/images/2600x1200/3-dark.png',
      selected: false,
    },
    {
      title: 'Growth Opportunities',
      type: 'PDF',
      typeColor: 'warning',
      description: 'Analysis of emerging opportunities and growth strategies',
      price: '$19',
      image: '/static/metronic/tailwind/dist/assets/media/images/2600x1200/3-dark.png',
      selected: false,
    },
    {
      title: 'Competitive Intelligence',
      type: 'XLSX',
      typeColor: 'success',
      description: 'Benchmarking and competitive positioning analysis',
      price: '$29',
      image: '/static/metronic/tailwind/dist/assets/media/images/2600x1200/3-dark.png',
      selected: false,
    },
    {
      title: 'Technology Assessment',
      type: 'PPTX',
      typeColor: 'danger', 
      description: 'Evaluation of emerging technologies and their market impact',
      price: '$15',
      image: '/static/metronic/tailwind/dist/assets/media/images/2600x1200/3-dark.png',
      selected: false,
    },
    {
      title: 'Investment Analysis',
      type: 'PDF',
      typeColor: 'warning',
      description: 'ROI analysis and investment recommendations and their market impact',
      price: '$35',
      image: '/static/metronic/tailwind/dist/assets/media/images/2600x1200/3-dark.png',
      selected: false,
    }
  ];

  onTypeChange(event: any) {
    // Handle type change if necessary
  }

  // Additional methods if needed
}
