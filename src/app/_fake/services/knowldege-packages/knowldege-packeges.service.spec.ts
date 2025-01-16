import { TestBed } from '@angular/core/testing';

import { KnowldegePackegesService } from './knowldege-packeges.service';

describe('KnowldegePackegesService', () => {
  let service: KnowldegePackegesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(KnowldegePackegesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
