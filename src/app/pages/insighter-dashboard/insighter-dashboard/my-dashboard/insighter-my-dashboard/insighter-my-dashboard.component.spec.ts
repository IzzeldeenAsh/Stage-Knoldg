import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsighterMyDashboardComponent } from './insighter-my-dashboard.component';

describe('InsighterMyDashboardComponent', () => {
  let component: InsighterMyDashboardComponent;
  let fixture: ComponentFixture<InsighterMyDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsighterMyDashboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InsighterMyDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
