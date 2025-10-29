import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KnowledgeTypesStatisticsComponent } from './knowledge-types-statistics.component';

describe('KnowledgeTypesStatisticsComponent', () => {
  let component: KnowledgeTypesStatisticsComponent;
  let fixture: ComponentFixture<KnowledgeTypesStatisticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KnowledgeTypesStatisticsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(KnowledgeTypesStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
