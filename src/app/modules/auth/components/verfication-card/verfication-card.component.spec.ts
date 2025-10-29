import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerficationCardComponent } from './verfication-card.component';

describe('VerficationCardComponent', () => {
  let component: VerficationCardComponent;
  let fixture: ComponentFixture<VerficationCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerficationCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VerficationCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
