import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrizePublisFeesComponent } from './prize-publis-fees.component';

describe('PrizePublisFeesComponent', () => {
  let component: PrizePublisFeesComponent;
  let fixture: ComponentFixture<PrizePublisFeesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PrizePublisFeesComponent]
    });
    fixture = TestBed.createComponent(PrizePublisFeesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
