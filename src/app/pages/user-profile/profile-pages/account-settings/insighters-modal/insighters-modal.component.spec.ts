import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsightersModalComponent } from './insighters-modal.component';

describe('InsightersModalComponent', () => {
  let component: InsightersModalComponent;
  let fixture: ComponentFixture<InsightersModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsightersModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InsightersModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
