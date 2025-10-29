import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddKnowledgeComponent } from './add-knowledge.component';

describe('AddKnowledgeComponent', () => {
  let component: AddKnowledgeComponent;
  let fixture: ComponentFixture<AddKnowledgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddKnowledgeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddKnowledgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
