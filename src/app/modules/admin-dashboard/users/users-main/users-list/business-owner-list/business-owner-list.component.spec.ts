import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BusinessOwnerListComponent } from './business-owner-list.component';

describe('BusinessOwnerListComponent', () => {
  let component: BusinessOwnerListComponent;
  let fixture: ComponentFixture<BusinessOwnerListComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [BusinessOwnerListComponent]
    });
    fixture = TestBed.createComponent(BusinessOwnerListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
