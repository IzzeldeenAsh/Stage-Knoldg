import { TestBed } from '@angular/core/testing';

import { ScrollAnimsService } from './scroll-anims.service';

describe('ScrollAnimsService', () => {
  let service: ScrollAnimsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScrollAnimsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
