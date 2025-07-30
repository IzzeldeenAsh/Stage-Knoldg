import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DonutEmployeeChartComponent } from './donut-employee-chart.component';

describe('DonutEmployeeChartComponent', () => {
  let component: DonutEmployeeChartComponent;
  let fixture: ComponentFixture<DonutEmployeeChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DonutEmployeeChartComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DonutEmployeeChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
