import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestsStatisticsComponent } from './requests-statistics.component';

describe('RequestsStatisticsComponent', () => {
  let component: RequestsStatisticsComponent;
  let fixture: ComponentFixture<RequestsStatisticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestsStatisticsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(RequestsStatisticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
