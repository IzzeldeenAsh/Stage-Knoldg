import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KnowledgeAnalyticsComponent } from './knowledge-analytics.component';

describe('KnowledgeAnalyticsComponent', () => {
  let component: KnowledgeAnalyticsComponent;
  let fixture: ComponentFixture<KnowledgeAnalyticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KnowledgeAnalyticsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(KnowledgeAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
