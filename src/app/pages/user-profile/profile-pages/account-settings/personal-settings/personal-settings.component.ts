import { Component, Injector, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { catchError, forkJoin, Observable, of, tap } from "rxjs";
import { IKnoldgProfile } from "src/app/_fake/models/profile.interface";
import { ConsultingFieldTreeService } from "src/app/_fake/services/consulting-fields-tree/consulting-fields-tree.service";
import { CountryService } from "src/app/_fake/services/countries-api/countries-get.service";
import { ProfileService } from "src/app/_fake/services/get-profile/get-profile.service";
import { IndustryService } from "src/app/_fake/services/industries/industry.service";
import { InvitationService } from "src/app/_fake/services/invitation/invitation.service";
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
  invitationForm!: FormGroup;
  isLoadingCountries: boolean = false;
  countries: any[] = [];  
  roles: string[] = [];
  consultingFields: any[] = [];
  industries: any[] = [];
  isUpdatingProfile$: Observable<boolean> = of(false);
  isLoading$: Observable<boolean> = of(false);
  isProcessingInvitation$: Observable<boolean>;
  profile: IKnoldgProfile;
  allIndustriesSelected: any[] = [];
  allConsultingFieldsSelected: any[] = [];
  socialNetworks: {type: string, link: string}[] = [];

  constructor(
    injector: Injector,
    private readonly _profileService: AuthService,
    private readonly fb: FormBuilder,
    private _countryService: CountryService,
    private _profilePost: UpdateProfileService,
    private getProfileService: ProfileService,
    private _consultingFieldService: ConsultingFieldTreeService,
    private _industries: IndustryService,
    private _invitationService: InvitationService
  ) {
    super(injector);
    this.isProcessingInvitation$ = this._invitationService.isLoading$;
  }

  ngOnInit(): void {
    this.handleAPIs();
    this.initForm();
    this.initInvitationForm();
  }

  handleAPIs(){
    this.isLoading$ = of(true);
    const profile$ = this.getProfileService.getProfile().pipe(
      tap((profile) => {
        this.profile = profile;
        this.roles = profile.roles;
        console.log('Current roles:', this.roles);
        console.log('Is insighter:', this.hasRole(['insighter']));
        if(this.hasRole(['insighter'])){
          this.callConsultingFields();
          this.callIndustries();
        }
        this.socialNetworks = profile.social || [];
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
      console.log('Industries data received:', industries);
      this.industries = industries;
    }, error => {
      console.error('Error loading industries:', error);
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
            nameEn: node.name,
            nameAr: node.name,
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
      linkedIn: this.getSocialLink('linkedin'),
      facebook: this.getSocialLink('facebook'),
      twitter: this.getSocialLink('twitter'),
      instagram: this.getSocialLink('instagram'),
    }); 
  }

  onConsultingNodesSelected(selectedNodes: any) {
    const filteredNodes = selectedNodes && selectedNodes.length > 0 
      ? selectedNodes.filter((node: any) => node.data.key !== 'selectAll')
      : [];
    this.allConsultingFieldsSelected = filteredNodes;
    this.personalInfoForm.get('consulting_field')?.setValue(filteredNodes);
  }

  onIndustrySelected(selectedNodes: any) {
    const filteredNodes = selectedNodes && selectedNodes.length > 0 
      ? selectedNodes.filter((node: any) => node.data.key !== 'selectAll')
      : [];
    this.allIndustriesSelected = filteredNodes;
    this.personalInfoForm.get('industries')?.setValue(filteredNodes);
  }

  initForm() {
    this.personalInfoForm = this.fb.group({
      first_name: ["", Validators.required],
      last_name: ["", Validators.required],
      country: [""],
      bio: [""],
      industries: [],
      consulting_field: [],
      linkedIn: [''],
      facebook: [''],
      twitter: [''],
      instagram: [''],
      youtube: ['']
    });
  }

  initInvitationForm() {
    this.invitationForm = this.fb.group({
      invitationCode: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6), Validators.pattern('^[0-9]*$')]]
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
    
    if (this.hasRole(['insighter'])) {
      // Call both profile and social networks update for insighters
      forkJoin([
        this._profilePost.postProfile(formData),
        this.submitSocialNetworks()
      ]).subscribe({
        next: ([profileRes, socialRes]) => {
          const message = this.lang === "ar" 
            ? "تم تعديل البروفايل"
            : "Profile Updated Successfully";
          this.showSuccess("", message);
          document.location.reload();
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      });
    } else {
      // Only call profile update for non-insighters
      this._profilePost.postProfile(formData).subscribe({
        next: (profileRes) => {
          const message = this.lang === "ar" 
            ? "تم تعديل البروفايل"
            : "Profile Updated Successfully";
          this.showSuccess("", message);
          document.location.reload();
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      });
    }
  }

  onSubmitInvitation() {
    if (this.invitationForm.invalid) {
      return;
    }

    const code = this.invitationForm.get('invitationCode')?.value;

    this._invitationService.acceptInsighterInvitation(code).subscribe({
      next: (response) => {
        const message = this.lang === "ar" 
          ? "تم قبول الدعوة بنجاح"
          : "Invitation accepted successfully";
        this.showSuccess("", message);
        this.invitationForm.reset();
        // Reload to reflect changes
        document.location.reload();
      },
      error: (error) => {
        this.handleServerErrors(error);
      }
    });
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

      if(this.profile.roles.includes('insighter') ){
           // Handle industries
      const industries = form.get('industries')?.value || [];
      
      // Regular industries (with numeric keys)
      const industriesList = industries.filter((node: any) => 
        typeof node.data.key === 'number' && node.data.key !== 'selectAll'
      );
      
      // Other industries (with custom input)
      const otherIndustriesFields = industries.filter((node: any) => 
        typeof node.data.key === 'string' && 
        node.data.key !== 'selectAll' && 
        node.data.customInput !== undefined && 
        node.data.customInput !== null
      );

      // Append regular industries
      if (industriesList.length > 0) {
        industriesList.forEach((industry: any) => {
          formData.append("industries[]", industry.data.key.toString());
        });
      }

      // Append other industries with custom input
      if (otherIndustriesFields.length > 0) {
        otherIndustriesFields.forEach((field: any, index: number) => {
          formData.append(
            `suggest_industries[${index}][parent_id]`, 
            field.parent?.key === "selectAll" ? "0" : field.parent?.key
          );
          formData.append(`suggest_industries[${index}][name][en]`, field.data.customInput);
          formData.append(`suggest_industries[${index}][name][ar]`, field.data.customInput);
        });
      }
      }else{
       this.profile.industries.forEach((industry: any) => {
        formData.append("industries[]", industry.id.toString());
       })
      }
   
      if(this.hasRole(['insighter'])){

      // Handle consulting fields
      const consultingFields = form.get('consulting_field')?.value || [];
      
      // Regular consulting fields (with numeric keys)
      const consultingFieldList = consultingFields.filter((node: any) => 
        typeof node.data.key === 'number' && node.data.key !== 'selectAll'
      );
      
      // Other consulting fields (with custom input)
      const otherConsultingFields = consultingFields.filter((node: any) => 
        typeof node.data.key === 'string' && 
        node.data.key !== 'selectAll' && 
        node.data.customInput !== undefined && 
        node.data.customInput !== null
      );

      // Append regular consulting fields
      if (consultingFieldList.length > 0) {
        consultingFieldList.forEach((field: any) => {
          formData.append("consulting_field[]", field.data.key.toString());
        });
      }

      // Append other consulting fields with custom input
      if (otherConsultingFields.length > 0) {
        otherConsultingFields.forEach((field: any, index: number) => {
          formData.append(
            `suggest_consulting_fields[${index}][parent_id]`, 
            field.parent?.key === "selectAll" ? "0" : field.parent?.key
          );
          formData.append(`suggest_consulting_fields[${index}][name][en]`, field.data.customInput);
          formData.append(`suggest_consulting_fields[${index}][name][ar]`, field.data.customInput);
        });
      }
      }else{
        this.profile.consulting_field.forEach((field: any) => {
          formData.append("consulting_field[]", field.id.toString());
         })
      }

      if(this.hasRole(['company']) && this.profile.company?.legal_name){
        formData.append("legal_name", this.profile.company.legal_name);
        formData.append("about_us", this.profile.company.about_us);
      }
      if(this.hasRole(['company']) && this.profile.company?.website){
        formData.append("website", this.profile.company.website);
      }
    }

    return formData;
  }

  private isClientOnly(): boolean {
    return this.hasRole(["client"]) && 
           !this.hasRole(["company"]) && 
           !this.hasRole(["insighter"]) && 
           !this.hasRole(["company-insighter"]);
  }

  private submitSocialNetworks() {
    const form = this.personalInfoForm;
    
    this.socialNetworks = [];
    
    if (form.get('linkedIn')?.value) {
      this.socialNetworks.push({
        type: 'linkedin',
        link: form.get('linkedIn')?.value
      });
    }
    
    if (form.get('facebook')?.value) {
      this.socialNetworks.push({
        type: 'facebook',
        link: form.get('facebook')?.value
      });
    }
    
    if (form.get('twitter')?.value) {
      this.socialNetworks.push({
        type: 'twitter',
        link: form.get('twitter')?.value
      });
    }
    
    if (form.get('instagram')?.value) {
      this.socialNetworks.push({
        type: 'instagram',
        link: form.get('instagram')?.value
      });
    }

    if (form.get('youtube')?.value) {
      this.socialNetworks.push({
        type: 'youtube',
        link: form.get('youtube')?.value
      });
    }

    if (this.socialNetworks.length > 0) {
      if (this.hasRole(['insighter'])) {
        return this._profilePost.addInsighterSocial(this.socialNetworks);
      } else if (this.hasRole(['company'])) {
        return this._profilePost.addCompanySocial(this.socialNetworks);
      }
    }
    return of(null);
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

  private getSocialLink(type: string): string {
    const social = this.socialNetworks.find(s => s.type === type);
    return social ? social.link : '';
  }
}