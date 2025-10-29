import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerificationQuestionsListComponent } from './verification-questions-list.component';

describe('VerificationQuestionsListComponent', () => {
  let component: VerificationQuestionsListComponent;
  let fixture: ComponentFixture<VerificationQuestionsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificationQuestionsListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VerificationQuestionsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
