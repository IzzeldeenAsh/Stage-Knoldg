import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConsultingFieldsComponent } from './consulting-fields.component';

describe('ConsultingFieldsComponent', () => {
  let component: ConsultingFieldsComponent;
  let fixture: ComponentFixture<ConsultingFieldsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConsultingFieldsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConsultingFieldsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
