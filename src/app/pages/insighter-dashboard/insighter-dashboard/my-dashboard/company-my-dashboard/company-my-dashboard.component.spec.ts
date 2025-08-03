import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyMyDashboardComponent } from './company-my-dashboard.component';

describe('CompanyMyDashboardComponent', () => {
  let component: CompanyMyDashboardComponent;
  let fixture: ComponentFixture<CompanyMyDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyMyDashboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CompanyMyDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
