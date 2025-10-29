import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KnowledgeDetailsComponent } from './knowledge-details.component';

describe('KnowledgeDetailsComponent', () => {
  let component: KnowledgeDetailsComponent;
  let fixture: ComponentFixture<KnowledgeDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KnowledgeDetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(KnowledgeDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
