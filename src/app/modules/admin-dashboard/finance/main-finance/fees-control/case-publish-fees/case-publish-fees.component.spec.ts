import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CasePublishFeesComponent } from './case-publish-fees.component';

describe('CasePublishFeesComponent', () => {
  let component: CasePublishFeesComponent;
  let fixture: ComponentFixture<CasePublishFeesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CasePublishFeesComponent]
    });
    fixture = TestBed.createComponent(CasePublishFeesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
