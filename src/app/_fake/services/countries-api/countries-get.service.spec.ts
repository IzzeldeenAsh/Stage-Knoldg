import { TestBed } from '@angular/core/testing';

import { CountriesGetService } from './countries-get.service';

describe('CountriesGetService', () => {
  let service: CountriesGetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CountriesGetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
