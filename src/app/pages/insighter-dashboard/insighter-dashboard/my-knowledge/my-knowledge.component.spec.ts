import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyKnowledgeComponent } from './my-knowledge.component';

describe('MyKnowledgeComponent', () => {
  let component: MyKnowledgeComponent;
  let fixture: ComponentFixture<MyKnowledgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyKnowledgeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MyKnowledgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
