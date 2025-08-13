import { Component, Injector, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BaseComponent } from 'src/app/modules/base.component';
import { PaymentService, StripeCountry } from 'src/app/_fake/services/payment/payment.service';
import { CountriesService, Country } from 'src/app/_fake/services/countries/countries.service';

@Component({
  selector: 'app-setup-payment-info',
  templateUrl: './setup-payment-info.component.html',
  styleUrls: ['./setup-payment-info.component.scss']
})
export class SetupPaymentInfoComponent extends BaseComponent implements OnInit {
  paymentForm: FormGroup;
  paymentTypes = [
    {
      id: 'manual',
      name: { en: 'Manual', ar: 'يدوي' },
      imageUrl: 'https://res.cloudinary.com/dsiku9ipv/image/upload/v1754912766/payment-method_4689897_zrev9z.png'
    },
    {
      id: 'stripe', 
      name: { en: 'Stripe', ar: 'Stripe' },
      imageUrl: 'https://res.cloudinary.com/dsiku9ipv/image/upload/v1754902439/New_Project_12_jmtvd6.png'
    }
  ];

  selectedPaymentType: string | null = null;
  allCountries: Country[] = [];
  stripeCountries: StripeCountry[] = [];
  filteredCountries: any[] = [];
  searchTerm: string = '';
  selectedCountry: any = null;
  showValidationErrors: boolean = false;

  constructor(
    injector: Injector,
    private fb: FormBuilder,
    private router: Router,
    public paymentService: PaymentService,
    private countriesService: CountriesService
  ) {
    super(injector);
    this.paymentForm = this.fb.group({
      paymentType: ['', Validators.required],
      countryId: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.loadAllCountries();
  }

  loadAllCountries() {
    this.countriesService.getCountries().subscribe({
      next: (countries) => {
        this.allCountries = countries;
      },
      error: (error) => {
        this.handleServerErrors(error);
      }
    });
  }

  loadStripeCountries() {
    this.paymentService.getStripeCountries().subscribe({
      next: (countries) => {
        this.stripeCountries = countries;
        this.filteredCountries = [...this.stripeCountries];
      },
      error: (error) => {
        this.handleServerErrors(error);
      }
    });
  }

  selectPaymentType(type: string) {
    this.selectedPaymentType = type;
    this.paymentForm.patchValue({ paymentType: type });
    this.selectedCountry = null;
    this.paymentForm.patchValue({ countryId: '' });
    
    if (type === 'stripe') {
      this.loadStripeCountries();
    } else {
      this.filteredCountries = [...this.allCountries];
    }
    
    this.filterCountries();
  }

  selectCountry(country: any) {
    this.selectedCountry = country;
    this.paymentForm.patchValue({ countryId: country.id });
  }

  filterCountries() {
    if (!this.searchTerm) {
      this.filteredCountries = this.selectedPaymentType === 'stripe' 
        ? [...this.stripeCountries] 
        : [...this.allCountries];
      return;
    }

    const countries = this.selectedPaymentType === 'stripe' ? this.stripeCountries : this.allCountries;
    this.filteredCountries = countries.filter(country => {
      const name = this.getCountryName(country).toLowerCase();
      return name.includes(this.searchTerm.toLowerCase());
    });
  }

  getCountryName(country: any): string {
    if (this.selectedPaymentType === 'stripe') {
      return country.name;
    } else {
      return this.lang === 'ar' ? country.names?.ar : country.names?.en;
    }
  }

  getFlagUrl(flagName: string): string {
    return `assets/media/flags/${flagName}.svg`;
  }

  onNext() {
    if (this.paymentForm.valid) {
      const formData = {
        type: this.selectedPaymentType as 'manual' | 'stripe',
        country_id: this.selectedCountry.id
      };

      this.paymentService.setPaymentType(formData).subscribe({
        next: () => {
          this.showSuccess(
            this.lang === 'ar' ? 'تم الحفظ' : 'Success',
            this.lang === 'ar' ? 'تم حفظ نوع الدفع بنجاح' : 'Payment type saved successfully'
          );
          
          // Navigate to appropriate next step
          if (this.selectedPaymentType === 'manual') {
            this.router.navigate(['/app/setup-payment-info/manual-account']);
          } else if (this.selectedPaymentType === 'stripe') {
            this.initiateStripeOnboarding();
          }
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      });
    } else {
      this.showValidationErrors = true;
      
      if (!this.selectedPaymentType) {
        this.showError(
          this.lang === 'ar' ? 'حدث خطأ' : 'Validation Error',
          this.lang === 'ar' ? 'يرجى اختيار نوع الدفع' : 'Please select a payment type'
        );
      } else if (!this.selectedCountry) {
        this.showError(
          this.lang === 'ar' ? 'حدث خطأ' : 'Validation Error',
          this.lang === 'ar' ? 'يرجى اختيار الدولة' : 'Please select a country'
        );
      }
    }
  }

  private initiateStripeOnboarding() {
    this.paymentService.createStripeAccount().subscribe({
      next: (response) => {
        if (response.data.stripe_account_link.url) {
          // Redirect to Stripe onboarding
          window.location.href = response.data.stripe_account_link.url;
        } else {
          this.showError(
            this.lang === 'ar' ? 'حدث خطأ' : 'Error',
            this.lang === 'ar' ? 'لم يتم العثور على رابط Stripe' : 'Stripe link not found'
          );
        }
      },
      error: (error) => {
        // Handle specific case of existing Stripe account (422 error)
        if (error.status === 422 && error.error && error.error.message === "Stripe account exists") {
          this.router.navigate(['/app/setup-payment-info/stripe-callback']);
          return;
        }
        this.handleServerErrors(error);
      }
    });
  }

  private handleServerErrors(error: any) {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          this.showError(
            this.lang === "ar" ? "حدث خطأ" : "An error occurred",
            messages.join(", ")
          );
        }
      }
    } else {
      this.showError(
        this.lang === "ar" ? "حدث خطأ" : "An error occurred",
        this.lang === "ar" ? "حدث خطأ" : "An unexpected error occurred."
      );
    }
  }
}