import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubStepDocumentsComponent } from './sub-step-documents.component';

describe('SubStepDocumentsComponent', () => {
  let component: SubStepDocumentsComponent;
  let fixture: ComponentFixture<SubStepDocumentsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubStepDocumentsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SubStepDocumentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
