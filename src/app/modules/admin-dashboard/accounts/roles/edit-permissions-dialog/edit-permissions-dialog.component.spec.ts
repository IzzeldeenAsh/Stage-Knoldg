import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditPermissionsDialogComponent } from './edit-permissions-dialog.component';

describe('EditPermissionsDialogComponent', () => {
  let component: EditPermissionsDialogComponent;
  let fixture: ComponentFixture<EditPermissionsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditPermissionsDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EditPermissionsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
