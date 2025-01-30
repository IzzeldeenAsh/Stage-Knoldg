import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewMyPackagesComponent } from './view-my-packages.component';

describe('ViewMyPackagesComponent', () => {
  let component: ViewMyPackagesComponent;
  let fixture: ComponentFixture<ViewMyPackagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewMyPackagesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ViewMyPackagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
