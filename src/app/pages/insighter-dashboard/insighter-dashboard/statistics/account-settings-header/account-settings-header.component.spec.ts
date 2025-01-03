import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountSettingsHeaderComponent } from './account-settings-header.component';

describe('AccountSettingsHeaderComponent', () => {
  let component: AccountSettingsHeaderComponent;
  let fixture: ComponentFixture<AccountSettingsHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountSettingsHeaderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AccountSettingsHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
