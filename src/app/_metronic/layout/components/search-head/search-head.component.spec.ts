import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchHeadComponent } from './search-head.component';

describe('SearchHeadComponent', () => {
  let component: SearchHeadComponent;
  let fixture: ComponentFixture<SearchHeadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchHeadComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SearchHeadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
