import { TestBed } from '@angular/core/testing';

import { InsighterRegistraionService } from './insighter-registraion.service';

describe('InsighterRegistraionService', () => {
  let service: InsighterRegistraionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InsighterRegistraionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
