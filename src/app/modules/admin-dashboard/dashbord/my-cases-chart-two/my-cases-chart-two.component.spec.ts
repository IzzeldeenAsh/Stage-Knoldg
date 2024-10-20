import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyCasesChartTwoComponent } from './my-cases-chart-two.component';

describe('MyCasesChartTwoComponent', () => {
  let component: MyCasesChartTwoComponent;
  let fixture: ComponentFixture<MyCasesChartTwoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MyCasesChartTwoComponent]
    });
    fixture = TestBed.createComponent(MyCasesChartTwoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
