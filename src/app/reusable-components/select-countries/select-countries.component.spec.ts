import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectCountriesComponent } from './select-countries.component';

describe('SelectCountriesComponent', () => {
  let component: SelectCountriesComponent;
  let fixture: ComponentFixture<SelectCountriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectCountriesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SelectCountriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
