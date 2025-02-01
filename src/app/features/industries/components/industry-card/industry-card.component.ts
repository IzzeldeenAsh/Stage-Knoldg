import { Component, Input } from '@angular/core';
import { Industry } from '../../../../shared/interfaces/industry.interface';

@Component({
  selector: 'app-industry-card',
  template: `
    <mat-card class="industry-card">
      <img mat-card-image [src]="industry.imageUrl" [alt]="industry.name">
      <mat-card-header>
        <mat-card-title>{{industry.name}}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>{{industry.description}}</p>
        <div class="sub-industries">
          <h4>Sub Industries:</h4>
          <ul>
            <li *ngFor="let subIndustry of industry.subIndustries">
              {{subIndustry.name}}
            </li>
          </ul>
        </div>
      </mat-card-content>
      <mat-card-actions>
        <button mat-button color="primary">Learn More</button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .industry-card {
      max-width: 350px;
      margin: 16px;
      height: 100%;
    }
    
    .industry-card img {
      height: 200px;
      object-fit: cover;
    }
    
    .sub-industries {
      margin-top: 16px;
    }
    
    .sub-industries ul {
      list-style-type: none;
      padding-left: 0;
    }
    
    .sub-industries li {
      margin: 8px 0;
      color: #666;
    }
  `]
})
export class IndustryCardComponent {
  @Input() industry!: Industry;
}
