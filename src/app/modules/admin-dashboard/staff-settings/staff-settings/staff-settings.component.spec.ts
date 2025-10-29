import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StaffSettingsComponent } from './staff-settings.component';

describe('StaffSettingsComponent', () => {
  let component: StaffSettingsComponent;
  let fixture: ComponentFixture<StaffSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StaffSettingsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StaffSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
