import { Component, Injector, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { catchError, forkJoin, Observable, of, tap } from "rxjs";
import { IForsightaProfile } from "src/app/_fake/models/profile.interface";
import { ConsultingFieldTreeService } from "src/app/_fake/services/consulting-fields-tree/consulting-fields-tree.service";
import { CountryService } from "src/app/_fake/services/countries-api/countries-get.service";
import { ProfileService } from "src/app/_fake/services/get-profile/get-profile.service";
import { IndustryService } from "src/app/_fake/services/industries/industry.service";
import { UpdateProfileService } from "src/app/_fake/services/profile/profile.service";
import { AuthService } from "src/app/modules/auth";
import { BaseComponent } from "src/app/modules/base.component";

@Component({
  selector: "app-personal-settings",
  templateUrl: "./personal-settings.component.html",
  styleUrl: "./personal-settings.component.scss",
})
export class PersonalSettingsComponent extends BaseComponent implements OnInit {
  personalInfoForm!: FormGroup;
  isLoadingCountries: boolean = false;
  countries: any[] = [];  
  roles: string[] = [];
  consultingFields: any[] = [];
  industries: any[] = [];
  isUpdatingProfile$: Observable<boolean> = of(false);
  isLoading$: Observable<boolean> = of(false);
  profile: IForsightaProfile;
  allIndustriesSelected: any[] = [];
  allConsultingFieldsSelected: any[] = [];

  constructor(
    injector: Injector,
    private readonly _profileService: AuthService,
    private readonly fb: FormBuilder,
    private _countryService: CountryService,
    private _profilePost: UpdateProfileService,
    private getProfileService: ProfileService,
    private _consultingFieldService: ConsultingFieldTreeService,
    private _industries: IndustryService,
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.handleAPIs();
    this.initForm();
  }

  handleAPIs(){
    this.isLoading$ = of(true);
    const profile$ = this.getProfileService.getProfile().pipe(
      tap((profile) => {
        this.profile = profile;
        this.roles = profile.roles;
        if(this.hasRole(['insighter'])){
          this.callConsultingFields();
          this.callIndustries();
        }
      })
    );
    const countries$ = this._countryService.getCountries(this.lang ? this.lang : 'en').pipe(
      tap((countries) => {
        this.countries = countries.map((country: any) => ({
          ...country,
          flagPath: `assets/media/flags/${country.flag}.svg`,
          showFlag: true,
        }));
      }),
      catchError((err) => {
        return of([]);
      })
    );

    forkJoin([profile$, countries$]).subscribe({
      next: () => {
        this.populateForm();
        this.isLoading$ = of(false);
      },
      error: (err) => {
        this.isLoading$ = of(false);
      }
    });
  }

  callIndustries(){
    const sub = this._industries.getIsicCodesTree(this.lang ? this.lang : 'en').subscribe((industries: any) => {
      this.industries = industries;
    });
    this.unsubscribe.push(sub);
  }

  callConsultingFields(){
    const sub = this._consultingFieldService.getConsultingCodesTree(this.lang ? this.lang : 'en').subscribe((consultingFields: any) => {
      this.consultingFields = consultingFields;
    });
    this.unsubscribe.push(sub);
  }
  populateForm(){
    let transformedIndustries;
    let transformedConsultingFields;
    
    if(this.profile.roles.includes('insighter')){
      const transformNodes = (nodes: any[]): any[] => {
        return nodes.map(node => ({
          key: node.id,
          label: node.name,
          data: { 
            key: node.id,
            nameEn: node.names.en,
            nameAr: node.names.ar,
          },
          children: node.children ? transformNodes(node.children) : []
        }));
      };
      transformedIndustries = transformNodes(this.profile.industries);
      transformedConsultingFields = transformNodes(this.profile.consulting_field);
    }

    this.personalInfoForm.patchValue({
      first_name: this.profile.first_name,
      last_name: this.profile.last_name,
      country: this.countries.find((country: any) => country.id === this.profile.country_id),
      bio: this.profile.bio,
      ...(this.profile.roles.includes('insighter') ? {
        industries: transformedIndustries,
        consulting_field: transformedConsultingFields
      } : {}),
    }); 
  }

  onConsultingNodesSelected(selectedNodes: any) {
    this.allConsultingFieldsSelected = selectedNodes && selectedNodes.length > 0 ? selectedNodes : [];
    this.personalInfoForm.get('consulting_field')?.setValue(this.allConsultingFieldsSelected); // Corrected
  }

  onIndustrySelected(selectedNodes: any) {
    this.allIndustriesSelected = selectedNodes && selectedNodes.length > 0 ? selectedNodes : [];
    this.personalInfoForm.get('industries')?.setValue(this.allIndustriesSelected); // Corrected
  }

  initForm() {
    this.personalInfoForm = this.fb.group({
      first_name: ["", Validators.required],
      last_name: ["", Validators.required],
      country: [""],
      bio: [""],
      industries: [], // Correct form control
      consulting_field: [] // Correct form control
    });
  }

  onFlagError(country: any): void {
    country.showFlag = false;
  }

  hasRole(requiredRoles: string[]): boolean {
    return requiredRoles.some((role) => this.roles.includes(role));
  }

  onSubmit() {
    if (this.personalInfoForm.invalid) {
      return;
    }

    const formData = this.createFormData();
    this.postProfileAPI(formData);
  }

  private createFormData(): FormData {
    const formData = new FormData();
    const form = this.personalInfoForm;

    // Add basic info
    formData.append("first_name", form.get("first_name")?.value);
    formData.append("last_name", form.get("last_name")?.value);

    // Add country if selected
    if (form.get("country")?.value) {
      formData.append("country_id", form.get("country")?.value.id);
    }

    // Only add additional fields for non-client roles
    if (!this.isClientOnly()) {
      formData.append("bio", form.get("bio")?.value);
      
      // Add phone if exists
      if (this.profile.phone) {
        formData.append("phone", this.profile.phone);
      }

      // Add industries if any
      if (this.profile.industries?.length) {
        this.profile.industries.forEach((code: any) => {
          formData.append("industries[]", code.id.toString());
        });
      }

      // Add consulting fields if any  
      if (this.profile.consulting_field?.length) {
        this.profile.consulting_field.forEach((field: any) => {
          formData.append("consulting_field[]", field.id.toString());
        });
      }

      if(this.hasRole(['company']) && this.profile.company?.legal_name){
        formData.append("legal_name", this.profile.company.legal_name);
        formData.append("about_us", this.profile.company.about_us);
      }
    }

    // Log form data entries
    const formDataEntries: Array<{ key: string; value: string }> = [];
    formData.forEach((value, key) => {
      formDataEntries.push({ key, value: value.toString() });
    });
    return formData;
  }

  private isClientOnly(): boolean {
    return this.hasRole(["client"]) && 
           !this.hasRole(["company"]) && 
           !this.hasRole(["insighter"]);
  }

  postProfileAPI(formData: FormData) {
    const postprofileAPISub = this._profilePost
      .postProfile(formData)
      .subscribe({
        next: (res) => {
          const message =
            this.lang === "ar"
              ? "تم تعديل البروفايل"
              : "Profile Updated Successfully";
          this.showSuccess("", message);
          document.location.reload;
        },
        error: (error) => {
          this.handleServerErrors(error);
        },
      });
    this.unsubscribe.push(postprofileAPISub);
  }

  private handleServerErrors(error: any) {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          this.showError('',messages.join(", "));
        }
      }
    } else {
      this.showError('','An unexpected error occurred.');
    }
  }
}