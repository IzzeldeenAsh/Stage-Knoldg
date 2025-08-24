import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentCountryService {
  private selectedCountryIdSubject = new BehaviorSubject<number | null>(null);
  public selectedCountryId$ = this.selectedCountryIdSubject.asObservable();

  setCountryId(countryId: number) {
    this.selectedCountryIdSubject.next(countryId);
  }

  getCountryId(): number | null {
    return this.selectedCountryIdSubject.value;
  }

  clearCountryId() {
    this.selectedCountryIdSubject.next(null);
  }
}