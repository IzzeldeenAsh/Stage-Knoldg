import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetsRowComponent } from './widgets-row.component';

describe('WidgetsRowComponent', () => {
  let component: WidgetsRowComponent;
  let fixture: ComponentFixture<WidgetsRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WidgetsRowComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WidgetsRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
