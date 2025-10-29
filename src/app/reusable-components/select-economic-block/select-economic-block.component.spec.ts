import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectEconomicBlockComponent } from './select-economic-block.component';

describe('SelectEconomicBlockComponent', () => {
  let component: SelectEconomicBlockComponent;
  let fixture: ComponentFixture<SelectEconomicBlockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectEconomicBlockComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SelectEconomicBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
