import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

import { UsersComponent } from './users.component';
import { UsersListService } from 'src/app/_fake/services/users-list/users-list.service';

describe('UsersComponent', () => {
  let component: UsersComponent;
  let fixture: ComponentFixture<UsersComponent>;

  const usersListServiceMock = jasmine.createSpyObj<UsersListService>(
    'UsersListService',
    [
      'getClients',
      'getInsighters',
      'getCompanyInsighters',
      'deactivateAndDeleteClient',
      'activateInsighter',
      'deactivateInsighter',
      'deactivateInsighterWithDataDelete',
      'activateCompanyInsighter',
      'deactivateCompanyInsighter',
      'deactivateCompanyWithDataDelete'
    ]
  );
  usersListServiceMock.isLoading$ = of(false);
  usersListServiceMock.getClients.and.returnValue(of([]));
  usersListServiceMock.getInsighters.and.returnValue(of([]));
  usersListServiceMock.getCompanyInsighters.and.returnValue(of([]));
  usersListServiceMock.deactivateAndDeleteClient.and.returnValue(of({}));
  usersListServiceMock.activateInsighter.and.returnValue(of({}));
  usersListServiceMock.deactivateInsighter.and.returnValue(of({}));
  usersListServiceMock.deactivateInsighterWithDataDelete.and.returnValue(of({}));
  usersListServiceMock.activateCompanyInsighter.and.returnValue(of({}));
  usersListServiceMock.deactivateCompanyInsighter.and.returnValue(of({}));
  usersListServiceMock.deactivateCompanyWithDataDelete.and.returnValue(of({}));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UsersComponent],
      imports: [FormsModule],
      providers: [MessageService, { provide: UsersListService, useValue: usersListServiceMock }],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
