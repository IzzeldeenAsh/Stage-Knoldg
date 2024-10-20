import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsightaDashboardComponent } from './insighta-dashboard.component';

describe('InsightaDashboardComponent', () => {
  let component: InsightaDashboardComponent;
  let fixture: ComponentFixture<InsightaDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsightaDashboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InsightaDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
