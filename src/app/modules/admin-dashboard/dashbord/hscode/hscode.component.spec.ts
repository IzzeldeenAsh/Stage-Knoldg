import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HscodeComponent } from './hscode.component';

describe('HscodeComponent', () => {
  let component: HscodeComponent;
  let fixture: ComponentFixture<HscodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HscodeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HscodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
