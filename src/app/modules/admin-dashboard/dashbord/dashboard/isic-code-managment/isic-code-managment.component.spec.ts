import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ISICCodeManagmentComponent } from './isic-code-managment.component';

describe('ISICCodeManagmentComponent', () => {
  let component: ISICCodeManagmentComponent;
  let fixture: ComponentFixture<ISICCodeManagmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ISICCodeManagmentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ISICCodeManagmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
