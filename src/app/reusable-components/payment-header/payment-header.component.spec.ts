import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentHeaderComponent } from './payment-header.component';

describe('PaymentHeaderComponent', () => {
  let component: PaymentHeaderComponent;
  let fixture: ComponentFixture<PaymentHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PaymentHeaderComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});