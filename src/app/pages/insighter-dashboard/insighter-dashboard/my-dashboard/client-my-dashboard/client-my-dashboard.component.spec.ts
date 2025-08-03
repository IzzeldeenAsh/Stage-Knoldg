import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClientMyDashboardComponent } from './client-my-dashboard.component';

describe('ClientMyDashboardComponent', () => {
  let component: ClientMyDashboardComponent;
  let fixture: ComponentFixture<ClientMyDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientMyDashboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ClientMyDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
