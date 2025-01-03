import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsighterDashboardComponent } from './insighter-dashboard.component';

describe('InsighterDashboardComponent', () => {
  let component: InsighterDashboardComponent;
  let fixture: ComponentFixture<InsighterDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsighterDashboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InsighterDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
