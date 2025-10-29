import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KnowledgeStatisticsComponent } from './knowledge-statistics.component';

describe('KnowledgeStatisticsComponent', () => {
  let component: KnowledgeStatisticsComponent;
  let fixture: ComponentFixture<KnowledgeStatisticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KnowledgeStatisticsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(KnowledgeStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
