import { Component, Injectable, Injector, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { CountriesService, Country } from 'src/app/_fake/services/countries/countries.service';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { BaseComponent } from 'src/app/modules/base.component';

@Injectable({
  providedIn: 'root'
})
export class CountryUpdateModalService {
  private showModalSubject = new BehaviorSubject<boolean>(false);
  public showModal$ = this.showModalSubject.asObservable();

  showModal(): void {
    this.showModalSubject.next(true);
  }

  hideModal(): void {
    this.showModalSubject.next(false);
  }
}

@Component({
  selector: 'app-country-update-modal',
  templateUrl: './country-update-modal.component.html',
  styleUrls: ['./country-update-modal.component.scss']
})
export class CountryUpdateModalComponent extends BaseComponent implements OnInit {
  showModal: boolean = false;
  isLoadingCountries$: Observable<boolean> = of(true);
  isLoadingSubmit$: Observable<boolean> = of(false);
  countryForm: FormGroup;
  countries: Country[] = [];

  constructor(
    private fb: FormBuilder,
    private countriesService: CountriesService,
    private profileService: ProfileService,
    private modalService: CountryUpdateModalService,
    injector: Injector
  ) {
    super(injector);
    this.initializeForm();
    this.isLoadingCountries$ = this.countriesService.isLoading$;
  }

  ngOnInit(): void {
    this.loadCountries();

    // Subscribe to modal service
    this.modalService.showModal$.subscribe(show => {
      this.showModal = show;
    });
  }

  private initializeForm(): void {
    this.countryForm = this.fb.group({
      country: [null, [Validators.required]]
    });
  }

  private loadCountries(): void {
    // Skip loading countries if we're on logout/auth pages
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath.includes('/auth/logout') || currentPath.includes('/logout')) {
        console.log('[CountryUpdateModal] Skipping countries load on logout page');
        return;
      }
    }

    this.countriesService.getCountries().subscribe({
      next: (countries) => {
        this.countries = countries.map((country: Country) => ({
          ...country,
          flagPath: `../../../../../assets/media/flags/${country.flag}.svg`,
          showFlag: true,
        }));
      },
      error: (error) => {
        console.error('Error loading countries:', error);
        // Only show error if it's not a logout-related error
        if (!error.message?.includes('Network/CORS') && error.status !== 0) {
          this.showError(
            this.lang === 'ar' ? 'خطأ' : 'Error',
            this.lang === 'ar' ? 'فشل في تحميل البلدان' : 'Failed to load countries'
          );
        }
      }
    });
  }

  onFlagError(country: any): void {
    country.showFlag = false;
  }

  onSubmit(): void {
    if (this.countryForm.invalid) {
      this.countryForm.markAllAsTouched();
      return;
    }

    const selectedCountry = this.countryForm.value.country;
    this.isLoadingSubmit$ = of(true);

    this.profileService.updateCountry(selectedCountry.id.toString()).subscribe({
      next: (response) => {
        this.isLoadingSubmit$ = of(false);
        this.showSuccess(
          this.lang === 'ar' ? 'نجح' : 'Success',
          this.lang === 'ar' ? 'تم تحديث البلد بنجاح' : 'Country updated successfully'
        );
        this.modalService.hideModal();
        // Refresh profile to get updated data
        this.profileService.refreshProfile().subscribe();
      },
      error: (error) => {
        this.isLoadingSubmit$ = of(false);
        this.handleServerErrors(error);
      }
    });
  }

  onCancel(): void {
    this.countryForm.reset();
    this.modalService.hideModal();
  }

  private handleServerErrors(error: any): void {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          if(error.error.type === "warning"){
            this.showWarn(
              this.lang === 'ar' ? 'تحذير' : 'Warning',
              messages.join(', ')
            );
          }else{
            this.showError(
              this.lang === 'ar' ? 'حدث خطأ' : 'An error occurred',
              messages.join(', ')
            );
          }
        }
      }
    } else {
      this.showError(
        this.lang === 'ar' ? 'حدث خطأ' : 'An error occurred',
        this.lang === 'ar' ? 'حدث خطأ غير متوقع' : 'An unexpected error occurred.'
      );
    }
  }
}