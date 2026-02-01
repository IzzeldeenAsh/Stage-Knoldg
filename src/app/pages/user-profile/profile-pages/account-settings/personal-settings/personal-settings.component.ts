import { Component, Injector, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { catchError, forkJoin, Observable, of, tap } from "rxjs";
import { IKnoldgProfile } from "src/app/_fake/models/profile.interface";
import { ConsultingFieldTreeService } from "src/app/_fake/services/consulting-fields-tree/consulting-fields-tree.service";
import { CountriesService } from "src/app/_fake/services/countries/countries.service";
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
  isUpdatingProfile$: Observable<boolean>;
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
    private _countryService: CountriesService,
    private _profilePost: UpdateProfileService,
    private getProfileService: ProfileService,
    private _consultingFieldService: ConsultingFieldTreeService,
    private _industries: IndustryService,
    private _invitationService: InvitationService,
  ) {
    super(injector);
    this.isProcessingInvitation$ = this._invitationService.isLoading$;
    this.isUpdatingProfile$ = this._profilePost.isLoading$;
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
        // Load consulting fields and industries for all roles
        this.callConsultingFields();
        this.callIndustries();
        this.socialNetworks = profile.social || [];
      })
    );
    const countries$ = this._countryService.getCountries().pipe(
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
        this.updateFormValidators();
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
  updateFormValidators() {
    // Only add required validators for industries, consulting_field, and bio if user is not client-only
    if (!this.isClientOnly()) {
      this.personalInfoForm.get('industries')?.setValidators([Validators.required]);
      this.personalInfoForm.get('consulting_field')?.setValidators([Validators.required]);
      this.personalInfoForm.get('bio')?.setValidators([Validators.required]);
    } else {
      // Remove any existing validators for client-only users
      this.personalInfoForm.get('industries')?.clearValidators();
      this.personalInfoForm.get('consulting_field')?.clearValidators();
      this.personalInfoForm.get('bio')?.clearValidators();
    }
    this.personalInfoForm.get('industries')?.updateValueAndValidity();
    this.personalInfoForm.get('consulting_field')?.updateValueAndValidity();
    this.personalInfoForm.get('bio')?.updateValueAndValidity();
  }

  populateForm(){
    let transformedIndustries;
    let transformedConsultingFields;
    
    const transformNodes = (nodes: any[]): any[] => {
      if (!nodes || !Array.isArray(nodes)) return [];
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
    
    // Transform industries and consulting fields for all roles
    transformedIndustries = transformNodes(this.profile.industries || []);
    transformedConsultingFields = transformNodes(this.profile.consulting_field || []);
    
    this.personalInfoForm.patchValue({
      first_name: this.profile.first_name,
      last_name: this.profile.last_name,
      country: this.countries.find((country: any) => country.id === this.profile.country_id),
      phoneCountryCode: this.profile.phone_code || '',
      phoneNumber: this.profile.phone || '',
      bio: this.profile.bio || '',
      industries: transformedIndustries,
      consulting_field: transformedConsultingFields,
      linkedIn: this.getSocialLink('linkedin'),
      facebook: this.getSocialLink('facebook'),
      twitter: this.getSocialLink('twitter'),
      instagram: this.getSocialLink('instagram'),
      youtube: this.getSocialLink('youtube'),
      tiktok: this.getSocialLink('tiktok'),
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
    console.log('Selected Industries:', filteredNodes);
  }

  initForm() {
    this.personalInfoForm = this.fb.group({
      first_name: ["", Validators.required],
      last_name: ["", Validators.required],
      country: ["", Validators.required],
      phoneCountryCode: [""],
      phoneNumber: [""],
      bio: [""],
      industries: [[]],
      consulting_field: [[]],
      linkedIn: ['', [Validators.pattern('^https://www\.linkedin\.com/.*$')]],
      facebook: ['', [Validators.pattern('^https://www\.facebook\.com/.*$')]],
      twitter: ['', [Validators.pattern('^https://www\.(twitter\.com|x\.com)/.*$')]],
      instagram: ['', [Validators.pattern('^https://www\.instagram\.com/.*$')]],
      youtube: ['', [Validators.pattern('^https://www\.youtube\.com/.*$')]],
      tiktok: ['', [Validators.pattern('^https://www\.tiktok\.com/.*$')]]
    });

    // Add required validators for non-client users after form initialization
    this.updateFormValidators();
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
    // Mark all fields as touched to show validation errors
    this.personalInfoForm.markAllAsTouched();
    
    if (this.personalInfoForm.invalid) {
      return;
    }

    const formData = this.createFormData();
    
    if (this.hasRole(['insighter']) || this.hasRole(['company-insighter'])) {
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
          this.refreshProfileAndForm();
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
          this.refreshProfileAndForm();
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      });
    }
  }

  onSubmitInvitation() {
    // Mark all fields as touched to show validation errors
    this.invitationForm.markAllAsTouched();
    
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
        // Refresh profile locally to reflect new roles/permissions
        this.refreshProfileAndForm();
      },
      error: (error) => {
        this.handleServerErrors(error);
      }
    });
  }

  /**
   * Refreshes profile data (clears cache) and re-populates the form
   * so we don't rely on full page reload after updates (e.g. social links).
   */
  private refreshProfileAndForm(): void {
    const sub = this.getProfileService.refreshProfile().subscribe({
      next: (profile) => {
        this.profile = profile;
        this.roles = profile.roles || [];
        this.socialNetworks = profile.social || [];
        this.updateFormValidators();
        this.populateForm();
        this.personalInfoForm.markAsPristine();
      },
      error: (error) => {
        // If refresh fails, we still keep the locally-updated form values.
        // Show a non-blocking warning so user knows data might be stale elsewhere.
        const msg =
          this.lang === "ar"
            ? "تم الحفظ، ولكن حدثت مشكلة أثناء تحديث البيانات."
            : "Saved, but failed to refresh data.";
        this.showWarn("", msg);
      },
    });
    this.unsubscribe.push(sub);
  }
  private createFormData(): FormData {
    const formData = new FormData();
    const form = this.personalInfoForm;

    // Add basic info
    formData.append("first_name", form.get("first_name")?.value);
    formData.append("last_name", form.get("last_name")?.value);

    // Add phone if provided
    if (form.get("phoneNumber")?.value) {
      formData.append("phone", form.get("phoneNumber")?.value);
    }

    // Add phone code if provided
    if (form.get("phoneCountryCode")?.value) {
      formData.append("phone_code", form.get("phoneCountryCode")?.value);
    }

    // Add country if selected
    if (form.get("country")?.value) {
      formData.append("country_id", form.get("country")?.value.id);
    }
   
    if (!this.isClientOnly()) {
      this.appendNonClientFields(formData, form);
    }

    return formData;
  }

  private appendNonClientFields(formData: FormData, form: any): void {
    formData.append("bio", form.get("bio")?.value);
    
    this.appendIndustries(formData, form.get('industries')?.value || []);
    this.appendConsultingFields(formData, form.get('consulting_field')?.value || []);
  }

  private appendIndustries(formData: FormData, industries: any[]): void {
    const regularIndustries = this.filterRegularNodes(industries);
    const otherIndustries = this.filterCustomNodes(industries);

    regularIndustries.forEach((industry: any) => {
      formData.append("industries[]", industry.data.key.toString());
    });

    otherIndustries.forEach((field: any, index: number) => {
      const parentId = field.parent?.key === "selectAll" ? "0" : field.parent?.key;
      formData.append(`suggest_industries[${index}][parent_id]`, parentId);
      formData.append(`suggest_industries[${index}][name][en]`, field.data.customInput);
      formData.append(`suggest_industries[${index}][name][ar]`, field.data.customInput);
    });
  }

  private appendConsultingFields(formData: FormData, consultingFields: any[]): void {
    const regularFields = this.filterRegularNodes(consultingFields);
    const otherFields = this.filterCustomNodes(consultingFields);

    regularFields.forEach((field: any) => {
      formData.append("consulting_field[]", field.data.key.toString());
    });

    otherFields.forEach((field: any, index: number) => {
      const parentId = field.parent?.key === "selectAll" ? "0" : field.parent?.key;
      formData.append(`suggest_consulting_fields[${index}][parent_id]`, parentId);
      formData.append(`suggest_consulting_fields[${index}][name][en]`, field.data.customInput);
      formData.append(`suggest_consulting_fields[${index}][name][ar]`, field.data.customInput);
    });
  }

  private filterRegularNodes(nodes: any[]): any[] {
    return nodes.filter(node => 
      typeof node.data.key === 'number' && node.data.key !== 'selectAll'
    );
  }

  private filterCustomNodes(nodes: any[]): any[] {
    return nodes.filter(node => 
      typeof node.data.key === 'string' && 
      node.data.key !== 'selectAll' && 
      node.data.customInput !== undefined && 
      node.data.customInput !== null
    );
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
        type: 'x',
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

    if (form.get('tiktok')?.value) {
      this.socialNetworks.push({
        type: 'tiktok',
        link: form.get('tiktok')?.value
      });
    }

    // Always send socials for roles that support them, even if empty
    if (this.hasRole(['insighter']) || this.hasRole(['company-insighter'])) {
      return this._profilePost.addInsighterSocial(this.socialNetworks);
    } else if (this.hasRole(['company'])) {
      return this._profilePost.addCompanySocial(this.socialNetworks);
    }
    return of(null);
  }

  private handleServerErrors(error: any) {
    const err = error?.error ?? error;
    const isWarning = err?.type === "warning";
    const show = (msg: string) => {
      if (isWarning) {
        this.showWarn('', msg);
      } else {
        this.showError('', msg);
      }
    };
  
    if (err?.errors) {
      const messages: string[] = [];
      if (Array.isArray(err.errors)) {
        messages.push(...err.errors.map((m: any) => String(m)));
      } else if (typeof err.errors === 'object') {
        for (const key in err.errors) {
          if (!Object.prototype.hasOwnProperty.call(err.errors, key)) continue;
          const value = err.errors[key];
          if (Array.isArray(value)) {
            messages.push(...value.map((m: any) => String(m)));
          } else if (typeof value === 'string') {
            messages.push(value);
          } else if (value && typeof value.message === 'string') {
            messages.push(value.message);
          }
        }
      }
      if (messages.length > 0) {
        show(messages.join(", "));
        return;
      }
    }
  
    // Prefer explicit message from backend body
    if (typeof err?.message === 'string' && err.message) {
      show(err.message);
      return;
    }
    // If backend sent a raw string as body
    if (typeof err === 'string' && err) {
      show(err);
      return;
    }
    // Handle 5xx responses explicitly
    const status: number | undefined = error?.status;
    const statusText: string | undefined = error?.statusText;
    if (typeof status === 'number' && status >= 500) {
      const generic = this.lang === 'ar' ? 'خطأ في الخادم. الرجاء المحاولة لاحقًا.' : 'Server error. Please try again later.';
      const suffix = status ? ` (HTTP ${status}${statusText ? `: ${statusText}` : ''})` : '';
      show(generic + suffix);
      return;
    }
  
    show(this.lang === 'ar' ? 'حدث خطأ غير متوقع.' : 'An unexpected error occurred.');
  }

  private getSocialLink(type: string): string {
    const candidates = type === 'twitter'
      ? ['twitter', 'x']
      : type === 'x'
        ? ['x', 'twitter']
        : [type];
    const social = this.socialNetworks.find(s => candidates.includes(s.type));
    return social ? social.link : '';
  }

  getFieldError(fieldName: string): string {
    const field = this.personalInfoForm.get(fieldName);
    if (field && field.invalid && field.touched) {
      if (field.errors?.['required']) {
        return this.lang === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required';
      }
      if (field.errors?.['pattern']) {
        const socialFields = ['linkedIn', 'facebook', 'twitter', 'instagram', 'youtube', 'tiktok'];
        if (socialFields.includes(fieldName)) {
          return this.lang === 'ar' 
            ? 'يجب أن يبدأ الرابط بـ https://www.' 
            : 'URL must start with https://www.';
        }
        return this.lang === 'ar' ? 'الرابط غير صحيح' : 'Invalid URL format';
      }
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.personalInfoForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  getInvitationFieldError(fieldName: string): string {
    const field = this.invitationForm.get(fieldName);
    if (field && field.invalid && field.touched) {
      if (field.errors?.['required']) {
        return this.lang === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required';
      }
      if (field.errors?.['minlength'] || field.errors?.['maxlength']) {
        return this.lang === 'ar' ? 'يجب أن يكون الرمز 6 أرقام' : 'Code must be 6 digits';
      }
      if (field.errors?.['pattern']) {
        return this.lang === 'ar' ? 'يجب أن يحتوي على أرقام فقط' : 'Only numbers allowed';
      }
    }
    return '';
  }

  isInvitationFieldInvalid(fieldName: string): boolean {
    const field = this.invitationForm.get(fieldName);
    return field ? field.invalid && field.touched : false;
  }

  onCountryCodeChange(countryCode: string): void {
    this.personalInfoForm.get('phoneCountryCode')?.setValue(countryCode);
  }

  onPhoneNumberChange(phoneNumber: string): void {
    this.personalInfoForm.get('phoneNumber')?.setValue(phoneNumber);
  }

  onFormattedPhoneNumberChange(formattedPhone: string): void {
    // Handle formatted phone number if needed
  }
}