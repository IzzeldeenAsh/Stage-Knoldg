import { TestBed } from '@angular/core/testing';

import { PreRegsiterService } from './pre-regsiter.service';

describe('PreRegsiterService', () => {
  let service: PreRegsiterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PreRegsiterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
