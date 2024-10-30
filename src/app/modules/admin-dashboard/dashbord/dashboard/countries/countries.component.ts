import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MessageService, Message } from "primeng/api";
import { Table } from "primeng/table";
import { Observable, Subscription } from "rxjs";
import { CountriesService, Country } from "src/app/_fake/services/countries/countries.service";
import { Region, RegionsService } from "src/app/_fake/services/region/regions.service";
import Swal from 'sweetalert2';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ICountry } from "src/app/_fake/models/country.model";

@Component({
  selector: "app-countries",
  templateUrl: "./countries.component.html",
  styleUrls: ["./countries.component.scss"],
})
export class CountriesComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  private unsubscribe: Subscription[] = [];
  listOfCountries: Country[] = [];
  filteredCountries: Country[] = [];
  selectedStatus: string | null = null; 
  isEditMode: boolean = false;
  isLoading$: Observable<boolean>;
  noOfActiveCountries:number= 0;
  noOfInactiveCountries:number= 0;
  selectedCountryId: number | null = null;
  visible: boolean = false;
  regionOptions: { label: string, value: number }[] = [];
  selectedRegionId: number | null = 0;
  statusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' }
  ];

  countryForm: FormGroup;

  @ViewChild("dt") table: Table;

  constructor(
    private countriesService: CountriesService,
    private regionsService: RegionsService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private messageService: MessageService
  ) {
    this.isLoading$ = this.countriesService.isLoading$;
  }

  ngOnInit(): void {
    this.initializeForm();
    this.getCountriesList();
    this.getRegionsList();
  }

  initializeForm() {
    this.countryForm = this.fb.group({
      countryEn: ['', Validators.required],
      countryAr: ['', Validators.required],
      regionId: [null, Validators.required],
      internationalCode: ['', Validators.required],
      iso2: ['', Validators.required],
      iso3: ['', Validators.required],
      nationalityEn: ['', Validators.required],
      nationalityAr: ['', Validators.required],
      status: ['Active', Validators.required],
      flag: ['', Validators.required]
    });
  }

  filterCountries() {
    this.filteredCountries = this.listOfCountries.filter(country => {
      const matchesRegion = this.selectedRegionId ? country.region_id === this.selectedRegionId : true;
      const matchesStatus = this.selectedStatus ? country.status === this.selectedStatus : true;
      return matchesRegion && matchesStatus;
    });
  }

  getRegionsList() {
    this.regionsService.getRegions().subscribe({
      next: (data: Region[]) => {
        this.regionOptions = data.map(region => ({
          label: region.names.en,
          value: region.id
        }));
        this.regionOptions.unshift({ label: 'All Regions', value: 0 });
      },
      error: (error) => {
        this.messages = error.validationMessages || [{
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch regions.'
        }];
      }
    });
  }

  showDialog() {
    this.visible = true;
    this.selectedCountryId = null;
    this.isEditMode = false;
    this.countryForm.reset({ status: 'Active' });
  }

  editCountry(country: Country) {
    this.visible = true;
    this.selectedCountryId = country.id;
    this.isEditMode = true;
    this.countryForm.patchValue({
      countryEn: country.names.en,
      countryAr: country.names.ar,
      regionId: country.region_id,
      internationalCode: country.international_code,
      iso2: country.iso2,
      iso3: country.iso3,
      nationalityEn: country.nationalities.en,
      nationalityAr: country.nationalities.ar,
      status: country.status,
      flag: country.flag
    });
  }

  getCountriesList() {
    const listSub = this.countriesService.getCountries().subscribe({
      next: (data: Country[]) => {
        this.listOfCountries = data;
        this.noOfActiveCountries = this.listOfCountries.filter((country:any)=> country.status ==='Active').length
        this.noOfInactiveCountries = this.listOfCountries.filter((country:any)=> country.status ==='Inactive').length
        this.filteredCountries = [...this.listOfCountries];
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.messages = error.validationMessages || [{
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to fetch countries.'
        }];
      }
    });
    this.unsubscribe.push(listSub);
  }

  filterCountriesByRegion() {
    if (this.selectedRegionId && this.selectedRegionId !== 0) {
      this.filteredCountries = this.listOfCountries.filter(
        country => country.region_id === this.selectedRegionId
      );
    } else {
      this.filteredCountries = [...this.listOfCountries];
    }
  }

  applyFilter(event: any) {
    const value = event.target.value.trim().toLowerCase();
    this.table.filterGlobal(value, "contains");
  }

  submit() {
    this.messages = [];

    if (this.countryForm.invalid) {
      this.countryForm.markAllAsTouched();
      return;
    }

    const formValues = this.countryForm.value;

    const countryData = {
      name: {
        en: formValues.countryEn,
        ar: formValues.countryAr
      },
      region_id: formValues.regionId,
      iso2: formValues.iso2,
      iso3: formValues.iso3,
      nationality: {
        en: formValues.nationalityEn,
        ar: formValues.nationalityAr
      },
      international_code: formValues.internationalCode,
      flag: formValues.flag,
      status: formValues.status
    };

    if (this.selectedCountryId) {
      // Update existing country
      const updateSub = this.countriesService.updateCountry(this.selectedCountryId, countryData).subscribe({
        next: (res: Country) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Country updated successfully.'
          });
          this.getCountriesList();
          this.visible = false;
          this.countryForm.reset({ status: 'Active' });
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      });
      this.unsubscribe.push(updateSub);
    } else {
      // Create new country
      const createSub = this.countriesService.createCountry(countryData).subscribe({
        next: (res: any) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Country created successfully.'
          });
          this.getCountriesList();
          this.visible = false;
          this.countryForm.reset({ status: 'Active' });
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      });
      this.unsubscribe.push(createSub);
    }
  }

  onCancel() {
    this.visible = false;
    this.countryForm.reset({ status: 'Active' });
  }

  deleteCountry(countryId: number) {
    this.messages = [];
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this country? This action cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        const deleteSub = this.countriesService.deleteCountry(countryId).subscribe({
          next: (res: any) => {
            this.messageService.add({
              severity: 'success',
              summary: 'Success',
              detail: 'Country deleted successfully.'
            });
            this.getCountriesList();
          },
          error: (error) => {
            this.handleServerErrors(error);
          }
        });
        this.unsubscribe.push(deleteSub);
      }
    });
  }

  get hasSuccessMessage() {
    return this.messages.some(msg => msg.severity === 'success');
  }

  get hasErrorMessage() {
    return this.messages.some(msg => msg.severity === 'error');
  }

  // Getters for form controls
  get countryEn() {
    return this.countryForm.get('countryEn');
  }

  get countryAr() {
    return this.countryForm.get('countryAr');
  }

  get regionId() {
    return this.countryForm.get('regionId');
  }

  get internationalCode() {
    return this.countryForm.get('internationalCode');
  }

  get iso2() {
    return this.countryForm.get('iso2');
  }

  get iso3() {
    return this.countryForm.get('iso3');
  }

  get nationalityEn() {
    return this.countryForm.get('nationalityEn');
  }

  get nationalityAr() {
    return this.countryForm.get('nationalityAr');
  }

  get status() {
    return this.countryForm.get('status');
  }

  get flag() {
    return this.countryForm.get('flag');
  }

  private handleServerErrors(error: any) {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      const errorKeyToFormControlName: any = {
        'name.en': 'countryEn',
        'name.ar': 'countryAr',
        'region_id': 'regionId',
        'international_code': 'internationalCode',
        'iso2': 'iso2',
        'iso3': 'iso3',
        'nationality.en': 'nationalityEn',
        'nationality.ar': 'nationalityAr',
        'status': 'status',
        'flag': 'flag'
      };
  
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          const formControlName = errorKeyToFormControlName[key];
          if (formControlName) {
            const control = this.countryForm.get(formControlName);
            if (control) {
              control.setErrors({ serverError: messages[0] });
              control.markAsTouched();
            }
          } else {
            // General messages
            this.messages.push({ severity: 'error', summary: '', detail: messages.join(', ') });
          }
        }
      }
    } else {
      // Handle non-validation errors
      this.messages.push({
        severity: 'error',
        summary: 'Error',
        detail: 'An unexpected error occurred.'
      });
    }
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
