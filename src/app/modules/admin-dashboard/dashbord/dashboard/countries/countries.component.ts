import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Message } from "primeng/api";
import { Table } from "primeng/table";
import { Observable, Subscription } from "rxjs";
import { CountriesService, Country } from "src/app/_fake/services/countries/countries.service";
import Swal from 'sweetalert2';

@Component({
  selector: "app-countries",
  templateUrl: "./countries.component.html",
  styleUrls: ["./countries.component.scss"],
})
export class CountriesComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  private unsubscribe: Subscription[] = [];
  listOfCountries: Country[] = [];
  isEditMode: boolean = false;
  isLoading$: Observable<boolean>;
  selectedCountryId: number | null = null;
  visible: boolean = false;

  // Form fields
  newCountryEn: string = '';
  newCountryAr: string = '';
  newRegionId: number | null = null;
  newIso2: string = '';
  newIso3: string = '';
  newNationalityEn: string = '';
  newNationalityAr: string = '';
  newInternationalCode: string = '';
  newFlag: string = '';

  @ViewChild("dt") table: Table;

  constructor(
    private countriesService: CountriesService,
    private cdr: ChangeDetectorRef
  ) {
    this.isLoading$ = this.countriesService.isLoading$;
  }

  ngOnInit(): void {
    this.getCountriesList();
  }

  showDialog() {
    this.visible = true;
    this.resetForm();
    this.selectedCountryId = null;
    this.isEditMode = false;
  }

  editCountry(country: Country) {
    this.visible = true;
    this.newCountryEn = country.names.en;
    this.newCountryAr = country.names.ar;
    this.newRegionId = country.region_id;
    this.newIso2 = country.iso2;
    this.newIso3 = country.iso3;
    this.newNationalityEn = country.nationality.en;
    this.newNationalityAr = country.nationality.ar;
    this.newInternationalCode = country.international_code;
    this.newFlag = country.flag;
    this.selectedCountryId = country.id;
    this.isEditMode = true;
  }

  resetForm() {
    this.newCountryEn = '';
    this.newCountryAr = '';
    this.newRegionId = null;
    this.newIso2 = '';
    this.newIso3 = '';
    this.newNationalityEn = '';
    this.newNationalityAr = '';
    this.newInternationalCode = '';
    this.newFlag = '';
  }

  getCountriesList() {
    const listSub = this.countriesService.getCountries().subscribe({
      next: (data: Country[]) => {
        this.listOfCountries = data;
        this.cdr.detectChanges();
        console.log("listOfCountries", this.listOfCountries);
      },
      error: (error) => {
        this.messages = [];

        if (error.validationMessages) {
          this.messages = error.validationMessages;
        } else {
          this.messages.push({
            severity: "error",
            summary: "Error",
            detail: "An unexpected error occurred.",
          });
        }
      },
    });
    this.unsubscribe.push(listSub);
  }

  applyFilter(event: any) {
    const value = event.target.value.trim().toLowerCase();
    this.table.filterGlobal(value, "contains");
  }

  submit() {
    const countryData = {
      name: {
        en: this.newCountryEn,
        ar: this.newCountryAr
      },
      region_id: this.newRegionId,
      iso2: this.newIso2,
      iso3: this.newIso3,
      nationality: {
        en: this.newNationalityEn,
        ar: this.newNationalityAr
      },
      international_code: this.newInternationalCode,
      flag: this.newFlag
    };

    if (this.selectedCountryId) {
      // Update existing country
      const updateSub = this.countriesService.updateCountry(this.selectedCountryId, countryData).subscribe({
        next: (res: Country) => {
          this.messages.push({
            severity: 'success',
            summary: 'Success',
            detail: 'Country updated successfully.'
          });
          this.getCountriesList();
          this.visible = false;
        },
        error: (error) => {
          this.messages = error.validationMessages || [{
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update country.'
          }];
          this.visible = false;
        }
      });

      this.unsubscribe.push(updateSub);
    } else {
      // Create new country
      const createSub = this.countriesService.createCountry(countryData).subscribe({
        next: (res: any) => {
          this.messages.push({
            severity: 'success',
            summary: 'Success',
            detail: 'Country created successfully.'
          });
          this.getCountriesList();
          this.visible = false;
        },
        error: (error) => {
          this.messages = error.validationMessages || [{
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create country.'
          }];
          this.visible = false;
        }
      });

      this.unsubscribe.push(createSub);
    }
  }

  deleteCountry(countryId: number) {
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
            this.messages.push({
              severity: 'success',
              summary: 'Success',
              detail: 'Country deleted successfully.'
            });
            this.getCountriesList();
          },
          error: (error) => {
            this.messages = error.validationMessages || [{
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to delete country.'
            }];
          }
        });
        this.unsubscribe.push(deleteSub);
      }
    });
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
