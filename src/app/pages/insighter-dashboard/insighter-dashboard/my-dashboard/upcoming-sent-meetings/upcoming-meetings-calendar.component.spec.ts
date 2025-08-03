import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpcomingSentMeetingsComponent } from './upcoming-sent-meetings.component';

describe('UpcomingSentMeetingsComponent', () => {
  let component: UpcomingSentMeetingsComponent;
  let fixture: ComponentFixture<UpcomingSentMeetingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpcomingSentMeetingsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UpcomingSentMeetingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
