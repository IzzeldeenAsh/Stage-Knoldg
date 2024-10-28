import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { Message } from "primeng/api";
import { Table } from "primeng/table";
import { Observable, Subscription } from "rxjs";
import { CountriesService, Country } from "src/app/_fake/services/countries/countries.service";
import { Region, RegionsService } from "src/app/_fake/services/region/regions.service";
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
  filteredCountires: Country[] = [];
  isEditMode: boolean = false;
  isLoading$: Observable<boolean>;
  selectedCountryId: number | null = null;
  visible: boolean = false;
currentPage = 1;
perPage = 10;
totalRecords = 0;
filterKeyword: string = '';
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
  regionOptions: { label: string, value: number }[] = [];
selectedRegionId: number | null = null;
  statusOptions = [
    { label: 'Active', value: 'Active' },
    { label: 'Inactive', value: 'Inactive' }
  ];
  newStatus: string = 'Active'; // Default to 'Active'
  @ViewChild("dt") table: Table;

  constructor(
    private countriesService: CountriesService,
    private regionsService: RegionsService,
    private cdr: ChangeDetectorRef
  ) {
    this.isLoading$ = this.countriesService.isLoading$;
  }

  ngOnInit(): void {
    this.getCountriesList();
    this.getRegionsList(); // Fetch and set regions
  }
  getRegionsList() {
    this.regionsService.getRegions().subscribe({
      next: (data: Region[]) => {
        this.regionOptions = data.map(region => ({
          label: region.names.en, // Display in English (or adjust as needed)
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
    this.newNationalityEn = country.nationalities.en;
    this.newNationalityAr = country.nationalities.ar;
    this.newInternationalCode = country.international_code;
    this.newFlag = country.flag;
    this.newStatus = country.status; // Set status
    this.selectedCountryId = country.id;
    this.isEditMode = true;
    console.log("country",country);
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
    this.newStatus = 'Active'; // Reset to default
  }

  getCountriesList() {
    let apiUrl = 'https://api.4sighta.com/api/admin/setting/country/list'
    console.log("selectedRegionId", this.selectedRegionId);
    const listSub = this.countriesService.getCountries(apiUrl).subscribe({
      next: (data: Country[]) => {
        this.listOfCountries = data;
        this.filteredCountires = this.listOfCountries
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
  if(this.selectedRegionId){
    this.filteredCountires = this.listOfCountries.filter((country)=>country.region_id === this.selectedRegionId)
  }else{
    this.filteredCountires = this.listOfCountries
  }
  }
  applyFilter(event: any) {
    const value = event.target.value.trim().toLowerCase();
    this.table.filterGlobal(value, "contains");
  }

  submit() {
    this.messages=[]
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
      flag: this.newFlag,
      status: this.newStatus // Include status
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
        }
      });
      this.unsubscribe.push(createSub);
    }
  }
  

  deleteCountry(countryId: number) {
    this.messages=[]
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
  get hasSuccessMessage(){
    return this.messages.some(msg=>msg.severity ==='success')
   }
   get successMessages() {
    return this.messages.filter((msg) => msg.severity === 'success');
  }
   get hasErrorMessage() {
    return this.messages.some(msg => msg.severity === 'error');
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
