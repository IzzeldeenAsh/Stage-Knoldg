import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelatedKnowledgesComponent } from './related-knowledges.component';

describe('RelatedKnowledgesComponent', () => {
  let component: RelatedKnowledgesComponent;
  let fixture: ComponentFixture<RelatedKnowledgesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RelatedKnowledgesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RelatedKnowledgesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
