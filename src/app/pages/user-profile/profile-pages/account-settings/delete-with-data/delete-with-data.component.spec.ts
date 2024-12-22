import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteWithDataComponent } from './delete-with-data.component';

describe('DeleteWithDataComponent', () => {
  let component: DeleteWithDataComponent;
  let fixture: ComponentFixture<DeleteWithDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteWithDataComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DeleteWithDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
