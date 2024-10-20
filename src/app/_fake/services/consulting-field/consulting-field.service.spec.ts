import { TestBed } from '@angular/core/testing';

import { ConsultingFieldService } from './consulting-field.service';

describe('ConsultingFieldService', () => {
  let service: ConsultingFieldService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConsultingFieldService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
