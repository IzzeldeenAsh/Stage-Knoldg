import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeSearchEngineComponent } from './home-search-engine.component';

describe('HomeSearchEngineComponent', () => {
  let component: HomeSearchEngineComponent;
  let fixture: ComponentFixture<HomeSearchEngineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeSearchEngineComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HomeSearchEngineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
