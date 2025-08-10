import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { PhoneNumberInputComponent } from './phone-number-input.component';

describe('PhoneNumberInputComponent', () => {
  let component: PhoneNumberInputComponent;
  let fixture: ComponentFixture<PhoneNumberInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PhoneNumberInputComponent],
      imports: [FormsModule, ReactiveFormsModule, DropdownModule, NgxMaskDirective],
      providers: [provideNgxMask()]
    }).compileComponents();

    fixture = TestBed.createComponent(PhoneNumberInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default mask', () => {
    expect(component.currentMask).toBe('000-000-0000');
  });

  it('should update mask when country code changes', () => {
    component.onCountryCodeChange('966'); // Saudi Arabia
    expect(component.currentMask).toBe('0-0000-0000');
  });

  it('should update placeholder when country code changes', () => {
    component.onCountryCodeChange('966'); // Saudi Arabia
    expect(component.currentPlaceholder).toBe('5-1234-5678');
  });

  it('should have default placeholder', () => {
    expect(component.currentPlaceholder).toBe('123-456-7890');
  });

  it('should extract clean value correctly', () => {
    component.onPhoneNumberInput('123-456-7890');
    expect(component.value).toBe('1234567890');
  });

  it('should validate phone number pattern', () => {
    component.value = '1234567890';
    component.countryCode = '1'; // US
    const isValid = component.isValidPhoneNumber();
    expect(isValid).toBe(true);
  });
});