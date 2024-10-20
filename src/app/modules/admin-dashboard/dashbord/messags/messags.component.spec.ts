import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessagsComponent } from './messags.component';

describe('MessagsComponent', () => {
  let component: MessagsComponent;
  let fixture: ComponentFixture<MessagsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MessagsComponent]
    });
    fixture = TestBed.createComponent(MessagsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
