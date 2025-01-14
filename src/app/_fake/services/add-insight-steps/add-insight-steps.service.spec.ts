import { TestBed } from '@angular/core/testing';

import { AddInsightStepsService } from './add-insight-steps.service';

describe('AddInsightStepsService', () => {
  let service: AddInsightStepsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AddInsightStepsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
