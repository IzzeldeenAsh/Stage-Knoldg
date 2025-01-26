import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewMyKnowledgeComponent } from './view-my-knowledge.component';

describe('ViewMyKnowledgeComponent', () => {
  let component: ViewMyKnowledgeComponent;
  let fixture: ComponentFixture<ViewMyKnowledgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewMyKnowledgeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ViewMyKnowledgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
