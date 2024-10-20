import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyCasesChartComponent } from './my-cases-chart.component';

describe('MyCasesChartComponent', () => {
  let component: MyCasesChartComponent;
  let fixture: ComponentFixture<MyCasesChartComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [MyCasesChartComponent]
    });
    fixture = TestBed.createComponent(MyCasesChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
