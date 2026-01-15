import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductionLoginComponent } from './production-login.component';

describe('ProductionLoginComponent', () => {
  let component: ProductionLoginComponent;
  let fixture: ComponentFixture<ProductionLoginComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductionLoginComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProductionLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
