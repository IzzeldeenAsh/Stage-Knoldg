import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubStepChaptersComponent } from './sub-step-chapters.component';

describe('SubStepChaptersComponent', () => {
  let component: SubStepChaptersComponent;
  let fixture: ComponentFixture<SubStepChaptersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubStepChaptersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SubStepChaptersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
