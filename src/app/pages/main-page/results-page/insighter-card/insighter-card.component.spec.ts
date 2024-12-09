import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsighterCardComponent } from './insighter-card.component';

describe('InsighterCardComponent', () => {
  let component: InsighterCardComponent;
  let fixture: ComponentFixture<InsighterCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsighterCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InsighterCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
