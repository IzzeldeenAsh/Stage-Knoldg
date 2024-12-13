import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SettingsActionComponent } from './settings-action.component';

describe('SettingsActionComponent', () => {
  let component: SettingsActionComponent;
  let fixture: ComponentFixture<SettingsActionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsActionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SettingsActionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
