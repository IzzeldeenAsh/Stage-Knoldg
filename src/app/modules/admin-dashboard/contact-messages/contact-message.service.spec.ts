import { TestBed } from '@angular/core/testing';

import { ContactMessageService } from './contact-message.service';

describe('ContactMessageService', () => {
  let service: ContactMessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContactMessageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
