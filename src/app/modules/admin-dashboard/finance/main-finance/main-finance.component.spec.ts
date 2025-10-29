import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainFinanceComponent } from './main-finance.component';

describe('MainFinanceComponent', () => {
  let component: MainFinanceComponent;
  let fixture: ComponentFixture<MainFinanceComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MainFinanceComponent]
    });
    fixture = TestBed.createComponent(MainFinanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
