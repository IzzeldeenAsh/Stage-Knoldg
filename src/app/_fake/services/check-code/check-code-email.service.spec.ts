import { TestBed } from '@angular/core/testing';

import { CheckCodeEmailService } from './check-code-email.service';

describe('CheckCodeEmailService', () => {
  let service: CheckCodeEmailService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CheckCodeEmailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
