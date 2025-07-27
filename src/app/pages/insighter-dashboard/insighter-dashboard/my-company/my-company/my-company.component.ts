import { Knowledge } from 'src/app/_fake/services/knowledge/knowledge.service';
import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CountryDropdownComponent, Country as DropdownCountry } from 'src/app/reusable-components/country-dropdown/country-dropdown.component';
import { CountriesService, Country as ServiceCountry } from 'src/app/_fake/services/countries/countries.service';
import { CompanyAccountService } from 'src/app/_fake/services/company-account/company-account.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { ConfirmationService } from 'primeng/api';

interface Insighter {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  roles: string[];
  profile_photo_url: string | null;
  country: string;
  insighter_status: string;
  Knowledge_id?: number;
  verified_as_insighter: boolean;
  knowledge_type_statistics?: {
    report?: number;
    data?: number;
    insight?: number;
    manual?: number;
    course?: number;
  };
  company?: {
    status: string;
  };
}

interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  path: string;
  per_page: number;
  to: number;
  total: number;
}

@Component({
  selector: 'app-my-company',
  templateUrl: './my-company.component.html',
  styleUrls: ['./my-company.component.scss']
})
export class MyCompanyComponent extends BaseComponent implements OnInit {
  // Modal state
  displayAddEmployeeModal = false;
  
  // Account checking state
  isCheckingAccount = false;
  accountExists = false;
  accountExistError: string | null = null;
  accountInfo: any = null;
  apiCheckCompleted = false;
  industries: any[] = [];
  consultingFields: any[] = [];
  isInviting = false;
  
  // Forms
  emailForm: FormGroup;
  employeeForm: FormGroup;
  
  // Insighter table data
  insighters: Insighter[] = [];
  loading: boolean = false;
  totalRecords: number = 0;
  rows: number = 10;
  first: number = 0;
  paginationMeta: PaginationMeta | null = null;
  
  // Current user ID and profile info
  currentUserId: number | null = null;
  currentUserCountryId: number | null = null;
  
  // Track expanded rows
  expandedRows: {[key: number]: boolean} = {};
  
  // View mode for toggle between table and grid
  viewMode: 'table' | 'grid' = 'grid';
  
  // Countries data
  availableCountries: DropdownCountry[] = [];
  
  constructor(
    injector: Injector,
    private fb: FormBuilder,
    private companyAccountService: CompanyAccountService,
    private profileService: ProfileService,
    private confirmationService: ConfirmationService,
    private countriesService: CountriesService
  ) {
    super(injector);
    
    // Initialize forms
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
    
    this.employeeForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      country: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.profileService.getProfile().subscribe((user)=>{
      this.industries = user.industries;
      this.consultingFields = user.consulting_field;
      this.currentUserId = user.id;
      this.currentUserCountryId = user.country_id || null;
      
      // Set default country in employee form
      this.employeeForm.patchValue({
        country: this.currentUserCountryId
      });
    });
    
    // Load countries first, then load insighters
    this.loadCountries();
    
    // Load initial insighter data
    this.loadInsighters(1);
    
    // Listen for email changes to trigger account check
    this.emailForm.get('email')?.valueChanges
      .pipe(
        debounceTime(2000), // Wait for 500ms pause in typing
        distinctUntilChanged() // Only emit when value changes
      )
      .subscribe(email => {
        if (this.emailForm.get('email')?.valid && email) {
          this.isCheckingAccount = true; // Only show loading after debounce
          this.checkAccountExist(email);
        } else {
          // Reset form states when email is invalid
          this.resetAccountState();
        }
      });
  }
  
  // Load insighters with pagination
  loadInsighters(page: number = 1): void {
    this.loading = true;
    this.companyAccountService.getInsighters(page, this.rows).subscribe({
      next: (response) => {
        this.insighters = response.data;
        this.paginationMeta = response.meta;
        this.totalRecords = response.meta.total;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.showError('Error', 'Failed to load insighters');
        console.error('Error loading insighters:', error);
      }
    });
  }
  
  // Open the add employee modal
  openAddEmployeeModal(): void {
    this.resetForms();
    this.displayAddEmployeeModal = true;
  }
  
  // Close the add employee modal
  closeAddEmployeeModal(): void {
    this.displayAddEmployeeModal = false;
    this.resetForms();
  }
  
  // Reset all forms and state
  resetForms(): void {
    this.emailForm.reset();
    this.employeeForm.reset();
    
    // Set default country to current user's country
    this.employeeForm.patchValue({
      country: this.currentUserCountryId
    });
    
    this.resetAccountState();
  }
  
  // Reset account checking state
  resetAccountState(): void {
    this.accountExists = false;
    this.accountExistError = null;
    this.accountInfo = null;
    this.apiCheckCompleted = false;
  }
  
  // Check if account exists
  checkAccountExist(email: string): void {
    // Loading indicator is now set before this method is called
    this.accountExistError = null;
    this.apiCheckCompleted = false;
    
    this.companyAccountService.checkAccountExist(email)
      .subscribe({
        next: (response) => {
          this.isCheckingAccount = false;
          this.apiCheckCompleted = true;
          
          // Handle the new API response structure
          // Case 1: Empty array means no user found
          if (Array.isArray(response) && response.length === 0) {
            // Account doesn't exist - show form to create one
            this.accountExists = false;
            this.accountExistError = null;
            this.accountInfo = null;
            
            // Set email and default country in the employee form
            this.employeeForm.patchValue({
              email: email,
              firstName: '',
              lastName: '',
              country: this.currentUserCountryId
            });
            
            console.log('No user found - set default country for new account:', this.currentUserCountryId);
          } 
          // Case 2: Object with data property means user found
          else if (response && typeof response === 'object' && response.data) {
            // Account exists and is valid for invitation
            this.accountExists = true;
            this.accountExistError = null;
            this.accountInfo = response.data;
            
            // Check if country_id has a value
            let countryId: number | null = null;
            
            // Type assertion to access country_id property
            const userData = response.data as any;
            
            if (userData.country_id !== null && userData.country_id !== undefined) {
              // Case 2a: country_id has a value - use it
              countryId = userData.country_id;
              console.log('User found with country_id:', countryId);
            } else {
              // Case 2b: country_id has no value - use profile country_id as default
              countryId = this.currentUserCountryId;
              console.log('User found but no country_id - using profile default:', countryId);
            }
            
            // Update employee form with existing data
            this.employeeForm.patchValue({
              email: email,
              firstName: userData.first_name,
              lastName: userData.last_name,
              country: countryId
            });
            
            console.log('Set country for existing account:', countryId);
            console.log('Available countries at this time:', this.availableCountries.length);
            console.log('Form country value after patch:', this.employeeForm.get('country')?.value);
            
            // If countries haven't loaded yet, wait for them and then update the form
            if (this.availableCountries.length === 0) {
              console.log('Countries not loaded yet, waiting...');
              // Wait for countries to be loaded and then update the form
              const checkCountries = () => {
                if (this.availableCountries.length > 0) {
                  console.log('Countries now loaded, updating form...');
                  this.employeeForm.patchValue({ country: countryId });
                } else {
                  setTimeout(checkCountries, 100);
                }
              };
              checkCountries();
            }
          } else {
            // Unexpected response format
            this.accountExists = false;
            this.accountExistError = 'Unexpected response format from server';
            this.accountInfo = null;
            
            // Set default values
            this.employeeForm.patchValue({
              email: email,
              firstName: '',
              lastName: '',
              country: this.currentUserCountryId
            });
            
            console.log('Unexpected response format - set default country:', this.currentUserCountryId);
          }
        },
        error: (error) => {
          this.isCheckingAccount = false;
          this.apiCheckCompleted = true;
          
          if (error.error && error.error.message) {
            // Show error message from API
            this.accountExistError = error.error.message;
            this.accountExists = false;
            this.accountInfo = null;
          } else {
            // Generic error
            this.accountExistError = 'An error occurred while checking the account';
            this.accountExists = false;
            this.accountInfo = null;
          }
        }
      });
  }
  
  // Invite employee (this would be connected to a real API in the future)
  inviteEmployee(): void {
    this.isInviting = true;
    
    // Prepare data for API
    const email = this.accountExists ? this.accountInfo.email : this.employeeForm.get('email')?.value;
    const firstName = this.accountExists ? this.accountInfo.first_name : this.employeeForm.get('firstName')?.value;
    const lastName = this.accountExists ? this.accountInfo.last_name : this.employeeForm.get('lastName')?.value;
    
    // For existing accounts: use their country_id if exists, otherwise use form value (which defaults to profile country)
    // For new accounts: use form value (which defaults to profile country)
    let countryId: number | undefined = undefined;
    
    if (this.accountExists) {
      // Type assertion to access country_id property
      const userData = this.accountInfo as any;
      countryId = userData.country_id !== null && userData.country_id !== undefined ? 
        userData.country_id : 
        this.employeeForm.get('country')?.value;
    } else {
      // For new accounts: use form value (which defaults to profile country)
      countryId = this.employeeForm.get('country')?.value;
    }
    
    // Convert industry and consulting field IDs to strings
    const industryIds = this.industries.map(industry => industry.id.toString());
    const consultingFieldIds = this.consultingFields.map(field => field.id.toString());
    
    // Call the API
    this.companyAccountService.inviteInsighter({
      email: email,
      first_name: firstName,
      last_name: lastName,
      country_id: countryId,
      industries: industryIds,
      consulting_field: consultingFieldIds
    }).subscribe({
      next: (response) => {
        this.isInviting = false;
        this.showSuccess('Success', 'Insighter invitation has been sent');
        this.closeAddEmployeeModal();
        
        // Reload insighters maintaining the current page
        const currentPage = this.paginationMeta?.current_page || 1;
        this.loadInsighters(currentPage);
      },
      error: (error) => {
        this.isInviting = false;
        let errorMessage = 'An error occurred while sending the invitation';
        
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        } else if (error.error && error.error.errors && error.error.errors.common) {
          errorMessage = error.error.errors.common[0];
        }
        
        this.showError('Error', errorMessage);
      }
    });
  }
  
  // Get user initials for avatar
  getUserInitials(name: string): string {
    if (!name) return '';
    
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
    } else if (nameParts.length === 1) {
      return nameParts[0][0].toUpperCase();
    }
    
    return '';
  }
  
  // Get status badge class
  getStatusBadgeClass(status: string): string {
    // Check if insighter has 'company' in roles and use company.status if available
    const insighter = this.insighters.find(ins => ins.insighter_status === status);
    
    if (insighter && insighter.roles && insighter.roles.includes('company') && insighter.company && insighter.company.status) {
      switch (insighter.company.status) {
        case 'active':
          return 'badge-light-success';
        case 'pending':
          return 'badge-light-warning';
        case 'inactive':
          return 'badge-light-danger';
        default:
          return 'badge-light-info';
      }
    }
    
    // If no company role or company status, use the regular insighter_status
    switch (status) {
      case 'active':
        return 'badge-light-success';
      case 'pending':
        return 'badge-light-warning';
      case 'inactive':
        return 'badge-light-danger';
      default:
        return 'badge-light-info';
    }
  }
  
  // Get verification badge class
  getVerificationBadgeClass(verified: boolean): string {
    return verified ? 'badge-light-success' : 'badge-light-warning';
  }
  
  // Calculate total knowledge count for an insighter
  getTotalKnowledgeCount(insighter: Insighter): number {
    if (!insighter.knowledge_type_statistics) {
      return 0;
    }
    
    let total = 0;
    const stats = insighter.knowledge_type_statistics;
    
    // Sum all the knowledge types
    if (stats.report) total += stats.report;
    if (stats.data) total += stats.data;
    if (stats.insight) total += stats.insight;
    if (stats.manual) total += stats.manual;
    if (stats.course) total += stats.course;
    
    return total;
  }
  
  // Activate insighter
  activateInsighter(insighterId: number): void {
    // Find the insighter to check if they have a company role
    const insighter = this.insighters.find(ins => ins.id === insighterId);
    
    const confirmMessage = insighter && insighter.roles && insighter.roles.includes('company') 
      ? 'Are you sure you want to activate this company account?'
      : 'Are you sure you want to activate this insighter?';
    
    this.confirmationService.confirm({
      message: confirmMessage,
      header: 'Confirm Activation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.companyAccountService.activateInsighter(insighterId).subscribe({
          next: () => {
            const successMessage = insighter && insighter.roles && insighter.roles.includes('company')
              ? 'Company has been activated'
              : 'Insighter has been activated';
            
            this.showSuccess('Success', successMessage);
            // Reload insighters maintaining the current page
            const currentPage = this.paginationMeta?.current_page || 1;
            this.loadInsighters(currentPage);
          },
          error: (error) => {
            let errorMessage = 'An error occurred while activating';
            
            if (error.error && error.error.message) {
              errorMessage = error.error.message;
            } else if (error.error && error.error.errors && error.error.errors.common) {
              errorMessage = error.error.errors.common[0];
            }
            
            this.showError('Error', errorMessage);
          }
        });
      }
    });
  }
  
  // Deactivate insighter
  deactivateInsighter(insighterId: number): void {
    // Find the insighter to check if they have a company role
    const insighter = this.insighters.find(ins => ins.id === insighterId);
    
    const confirmMessage = insighter && insighter.roles && insighter.roles.includes('company') 
      ? 'Are you sure you want to deactivate this company account?'
      : 'Are you sure you want to deactivate this insighter?';
    
    this.confirmationService.confirm({
      message: confirmMessage,
      header: 'Confirm Deactivation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.companyAccountService.deactivateInsighter(insighterId).subscribe({
          next: () => {
            const successMessage = insighter && insighter.roles && insighter.roles.includes('company')
              ? 'Company has been deactivated'
              : 'Insighter has been deactivated';
            
            this.showSuccess('Success', successMessage);
            // Reload insighters maintaining the current page
            const currentPage = this.paginationMeta?.current_page || 1;
            this.loadInsighters(currentPage);
          },
          error: (error) => {
            let errorMessage = 'An error occurred while deactivating';
            
            if (error.error && error.error.message) {
              errorMessage = error.error.message;
            } else if (error.error && error.error.errors && error.error.errors.common) {
              errorMessage = error.error.errors.common[0];
            }
            
            this.showError('Error', errorMessage);
          }
        });
      }
    });
  }
  
  // Delete insighter
  deleteInsighter(insighterId: number): void {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete this insighter? This action cannot be undone.',
      header: 'Confirm Deletion',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.companyAccountService.deleteInsighter(insighterId).subscribe({
          next: () => {
            this.showSuccess('Success', 'Insighter has been deleted');
            // Reload insighters maintaining the current page
            const currentPage = this.paginationMeta?.current_page || 1;
            this.loadInsighters(currentPage);
          },
          error: (error) => {
            let errorMessage = 'An error occurred while deleting the insighter';
            
            if (error.error && error.error.message) {
              errorMessage = error.error.message;
            } else if (error.error && error.error.errors && error.error.errors.common) {
              errorMessage = error.error.errors.common[0];
            }
            
            this.showError('Error', errorMessage);
          }
        });
      }
    });
  }
  
  // Handle page change event
  onPageChange(event: any): void {
    this.first = event.first;
    this.rows = event.rows;
    const page = Math.floor(event.first / event.rows) + 1;
    this.loadInsighters(page);
  }
  
  // Load countries data
  loadCountries(): void {
    this.countriesService.getCountries().subscribe({
      next: (countries) => {
        if (countries && Array.isArray(countries) && countries.length > 0) {
          this.availableCountries = countries.map(country => ({ 
            ...country, 
            showFlag: true 
          } as DropdownCountry));
          console.log('Countries loaded successfully:', this.availableCountries.length);
          
          // Force the country dropdown to re-evaluate the selected country
          // This ensures the country dropdown shows the correct country name after countries are loaded
          const currentCountryId = this.employeeForm.get('country')?.value;
          console.log('Countries loaded, current country ID in form:', currentCountryId);
          if (currentCountryId) {
            // Trigger a change detection by temporarily setting the value to null and back
            this.employeeForm.get('country')?.setValue(null);
            setTimeout(() => {
              this.employeeForm.get('country')?.setValue(currentCountryId);
              console.log('Re-set country ID after countries loaded:', currentCountryId);
            }, 0);
          }
        } else {
          console.warn('Countries API returned empty array or null');
          this.availableCountries = [];
          this.showWarn('Warning', 'No countries available');
        }
      },
      error: (error) => {
        console.error('Error loading countries:', error);
        this.availableCountries = [];
        this.showError('Error', 'Failed to load countries');
      }
    });
  }
  
  // Toggle view mode between table and grid
  toggleViewMode(mode: 'table' | 'grid'): void {
    this.viewMode = mode;
  }
  
}
