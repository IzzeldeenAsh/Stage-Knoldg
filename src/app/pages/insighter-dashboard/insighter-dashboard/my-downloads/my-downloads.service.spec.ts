import { TestBed } from '@angular/core/testing';

import { MyDownloadsService } from './my-downloads.service';

describe('MyDownloadsService', () => {
  let service: MyDownloadsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MyDownloadsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
