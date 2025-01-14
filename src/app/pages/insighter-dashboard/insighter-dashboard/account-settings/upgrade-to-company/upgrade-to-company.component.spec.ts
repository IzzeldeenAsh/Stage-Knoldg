import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpgradeToCompanyComponent } from './upgrade-to-company.component';

describe('UpgradeToCompanyComponent', () => {
  let component: UpgradeToCompanyComponent;
  let fixture: ComponentFixture<UpgradeToCompanyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpgradeToCompanyComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UpgradeToCompanyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
