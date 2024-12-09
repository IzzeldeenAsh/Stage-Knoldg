import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedTreeSelectorComponent } from './shared-tree-selector.component';

describe('SharedTreeSelectorComponent', () => {
  let component: SharedTreeSelectorComponent;
  let fixture: ComponentFixture<SharedTreeSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedTreeSelectorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SharedTreeSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
