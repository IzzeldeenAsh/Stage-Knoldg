import { Component, OnInit, Injector, ElementRef, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { catchError, forkJoin, Observable, of, tap } from 'rxjs';
import { IForsightaProfile } from 'src/app/_fake/models/profile.interface';
import { CertificationService } from 'src/app/_fake/services/certifications/certification.service';
import { ConsultingFieldTreeService } from 'src/app/_fake/services/consulting-fields-tree/consulting-fields-tree.service';
import { DocumentsService } from 'src/app/_fake/services/douments-types/documents-types.service.spec';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { IndustryService } from 'src/app/_fake/services/industries/industry.service';
import { UpdateProfileService } from 'src/app/_fake/services/profile/profile.service';
import { AuthService } from 'src/app/modules/auth';
import { BaseComponent } from 'src/app/modules/base.component';
import Swal from "sweetalert2"; // Import Swal
@Component({
  selector: 'app-company-settings',
  templateUrl: './company-settings.component.html',
  styleUrl: './company-settings.component.scss'
})
export class CompanySettingsComponent extends BaseComponent implements OnInit {
  isLoading:boolean = false;
  isUpdatingProfile$ :Observable<boolean> = of(false);
  isLoading$ :Observable<boolean> = of(false);
  roles:string[] = [];
  industries:any[] = [];
  profile:IForsightaProfile;
  consultingFields: any[] = [];
  corporateInfoForm:FormGroup;
  form: FormGroup;
  allIndustriesSelected:any[] = [];
  allConsultingFieldsSelected:any[] = [];
  documentTypes: any[] = [];
  certifications: any[] = [];
  @ViewChild("fileInput") fileInput: ElementRef<HTMLInputElement>;
  @ViewChild("fileInputRegistry")
  fileInputRegistry: ElementRef<HTMLInputElement>;
  constructor(
    private _profileService: AuthService,
    private fb: FormBuilder,
    private _industries: IndustryService,
    private documentsService: DocumentsService,
    private certificationService: CertificationService,
    private _consultingFieldService: ConsultingFieldTreeService,
    private _profilePost: UpdateProfileService,
    injector: Injector,
    private getProfileService: ProfileService 
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.handleAPIs();
  }

  handleAPIs(){
    this.isLoading$ = of(true);

    const profile$ = this.getProfileService.getProfile().pipe(
      tap((profile) => {
        this.profile = profile;
        this.roles = profile.roles;
      })
    );

    const industries$ = this._industries.getIsicCodesTree(this.lang ? this.lang : 'en').pipe(
      tap((codes) => {
        this.industries = codes;
      }),
      catchError((error) => {
        return of([]);
      })
    );

    const consultingFields$ = this._consultingFieldService.getConsultingCodesTree(this.lang ? this.lang : 'en').pipe(
      tap((fields) => {
        this.consultingFields = fields;
      }),
      catchError((err) => {
        return of([]);
      })
    );

    const documentTypes$ = this.documentsService.getDocumentsTypes().pipe(
      tap((types) => {
        this.documentTypes = types;
      }),
      catchError((err) => {
        return of([]);
      })
    );

    forkJoin(
      [profile$, industries$, consultingFields$, documentTypes$]
    ).subscribe({
      next: () => {
        if(this.hasRole(["company"])){
          this.initForm(); // Initialize form here
          this.populateForm();
        }
        this.isLoading$ = of(false);
      },
      error: (err) => {
        this.isLoading$ = of(false);
      }
    });
  }

  initForm(){
    if(this.profile.roles.includes("company")){
      this.corporateInfoForm = this.fb.group({
        companyPhoneNumber: ["", Validators.required],
        companyAddress: ["", Validators.required],
        companyIndustries: [[], Validators.required],
        companyConsultingFields: [[], Validators.required],
        companyLegalName: ["", Validators.required],
        companyWebsite: [null],
        companyRegisterDocument: [null],
        companyAboutUs: ["",Validators.required],
        linkedIn: [''],
        facebook: [''],
        x: [''],
        instagram: [''],
        youtube: [''],
      });
      this.form = this.fb.group({
        certificationsAdded: this.fb.array([]),
      });
    }
  }

  get certificationsAdded(): FormArray<FormGroup> {
    return this.form.get("certificationsAdded") as FormArray;
  }
  get certificationControls(): FormGroup[] {
    return this.certificationsAdded.controls as FormGroup[];
  }
  getFileIconAdded(file: File) {
    if (file) {
      const extension = file.name.split(".").pop()?.toLowerCase();
      const iconPath = `./assets/media/svg/files/${extension}.svg`;
      // Optionally, you can add logic to handle missing icons
      return iconPath;
    }
    return "./assets/media/svg/files/default.svg";
  }
  addCertification(cert?: { type?: string; file?: File }) {
    const certForm = this.fb.group({
      type: [cert?.type || "", [Validators.required]],
      file: [cert?.file || null, [Validators.required]],
    });
    this.certificationsAdded.push(certForm);
  }
  removeCertificationAdded(index: number) {
    this.certificationsAdded.removeAt(index);
  }
  getFileIcon(url: string): string {
    if (url) {
      const extension = url.split(".").pop()?.toLowerCase();
      const iconPath = `assets/media/svg/files/${extension}.svg`;
      return iconPath;
    }
    return "assets/media/svg/files/default.svg";
  }
  removeCertification(index: number): void {
    const certification = this.certifications[index];

    if (!certification || !certification.id) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Invalid certification.",
      });
      return;
    }

    Swal.fire({
      title: "Are you sure?",
      text: `Are you sure you want to delete the certification "${certification.name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6", // Customize as needed
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        // Proceed with deletion
        this.certificationService
          .deleteCertification(certification.id)
          .subscribe({
            next: (response) => {
              this.certifications.splice(index, 1);
              // Show success message
              this.showSuccess("", "Certificate Deleted Successfully");
            },
            error: (error) => {
              this.showError("", "Failed to delete certification.");
            },
          });
      }
    });
  }
  onFileSelectedRegistry(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.corporateInfoForm.patchValue({ companyRegisterDocument: file });
      this.corporateInfoForm.get("companyRegisterDocument")?.markAsTouched();
    }
  }
  onFileDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files.item(0);
      this.corporateInfoForm.patchValue({ companyRegisterDocument: file });
      this.corporateInfoForm.get("companyRegisterDocument")?.markAsTouched();
    }
  }
  onDragOver(event: DragEvent) {
    event.preventDefault();
  }
  // Remove the uploaded register document
  removeRegisterDocument() {
    this.form.patchValue({ companyRegisterDocument: null });
    this.fileInputRegistry.nativeElement.value = "";
  }

  populateForm(){
    const transformNodes = (nodes: any[]): any[] => {
      return nodes.map(node => ({
        key: node.id,
        label: this.lang === 'ar' ? node.name : node.name,
        data: { 
          key: node.id,
          code: node.code,
          status: node.status,
          nameEn: node.name,
          nameAr: node.name,
        },
        children: node.children ? transformNodes(node.children) : []
      }));
    
    };
    this.certifications = this.profile.certifications
    ? this.profile.certifications
    : [];
    
    const transformedIndustries = transformNodes(this.profile.industries);
    const transformedConsultingFields = transformNodes(this.profile.consulting_field);

    this.corporateInfoForm.patchValue({
      companyIndustries: transformedIndustries,
      companyConsultingFields: transformedConsultingFields,
      companyLegalName: this.profile.company?.legal_name,
      companyWebsite: this.profile.company?.website,
      companyRegisterDocument: this.profile.company?.register_document,
      companyAboutUs: this.profile.company?.about_us,
      companyPhoneNumber: this.profile.company?.company_phone,
      companyAddress: this.profile.company?.address,
    });

    // Add social media population
    if (this.profile.company?.social) {
      this.profile.company.social.forEach((social: any) => {
        switch (social.type) {
          case 'linkedin':
            this.corporateInfoForm.patchValue({ linkedIn: social.link });
            break;
          case 'facebook':
            this.corporateInfoForm.patchValue({ facebook: social.link });
            break;
          case 'x':
            this.corporateInfoForm.patchValue({ x: social.link });
            break;
          case 'instagram':
            this.corporateInfoForm.patchValue({ instagram: social.link });
            break;
          case 'youtube':
            this.corporateInfoForm.patchValue({ youtube: social.link });
            break;
        }
      });
    }
  }

  getProfile(){
    const profileSubscription = this._profileService.getProfile().subscribe((profile) => {
      this.profile = profile;
      this.roles = profile.roles;
    });
    this.unsubscribe.push(profileSubscription);
  }
  onDropzoneClick() {
    this.fileInput.nativeElement.click();
  }
  onFileSelected(event: any) {
    const files: FileList = event.target.files;
    this.handleFiles(files);
    // Reset the file input to allow re-uploading the same file if needed
    this.fileInput.nativeElement.value = "";
  }
  handleFiles(files: FileList) {
    for (let i = 0; i < files.length; i++) {
      const file = files.item(i);
      if (file) {
        this.addCertification({ file });
      }
    }
  }
  onIndustrySelected(selectedNodes: any) {
    this.allIndustriesSelected = selectedNodes && selectedNodes.length > 0 ? selectedNodes : [];
    this.corporateInfoForm.get('companyIndustries')?.setValue(this.allIndustriesSelected);
  }

  onConsultingNodesSelected(selectedNodes: any) {
    this.allConsultingFieldsSelected = selectedNodes && selectedNodes.length > 0 ? selectedNodes : [];
    this.corporateInfoForm.get('companyConsultingFields')?.setValue(this.allConsultingFieldsSelected);
  }
  gerCertName(certId: string) {
    const doc = this.documentTypes.find((cert) => cert.id === certId);
    return doc.name;
  }
  hasRole(requiredRoles: string[]): boolean {
    return requiredRoles.some((role) => this.roles.includes(role));
  }
  get isSubmitDisabled(): boolean {
    if (this.corporateInfoForm.invalid) {
      return true;
    }

    if (this.hasRole(["insighter", "company"])) {
      return this.certificationsAdded.controls.some(
        (control) => control.get("type")?.invalid
      );
    }

    return false;
  }
  onSubmit(){
    if (this.isSubmitDisabled) {
      // Optionally, display a message or handle the disabled state
      return;
    }
    const formData = new FormData();
    formData.append("first_name", this.profile.first_name);
    formData.append("last_name", this.profile.last_name);
    if(this.profile.country_id){
      formData.append("country_id", this.profile.country_id.toString());
    }
    formData.append("company_phone", this.corporateInfoForm.get("companyPhoneNumber")?.value);
    formData.append("address", this.corporateInfoForm.get("companyAddress")?.value);
    formData.append("legal_name", this.corporateInfoForm.get("companyLegalName")?.value);
    formData.append("website", this.corporateInfoForm.get("companyWebsite")?.value);
    formData.append("about_us", this.corporateInfoForm.get("companyAboutUs")?.value);
    formData.append("consulting_fields", this.corporateInfoForm.get("companyConsultingFields")?.value);
    const industriesList = this.corporateInfoForm.get("companyIndustries")?.value.filter((node: any) => typeof node.key === 'number');
    const otherIndustriesFields = this.corporateInfoForm.get("companyIndustries")?.value.filter(
      (node: any) =>
        typeof node.key === 'string' &&
        node.key !== 'selectAll' &&
        node.data?.customInput
    );
    const consultingFieldList = this.corporateInfoForm.get("companyConsultingFields")?.value.filter((node: any) => typeof node.key === 'number');
      const otherConsultingFields = this.corporateInfoForm.get("companyConsultingFields")?.value.filter(
        (node: any) =>
          typeof node.key === 'string' &&
          node.key !== 'selectAll' &&
          node.data?.customInput
      );
    if(industriesList && industriesList.length>0){
      industriesList.forEach((code: any) => {
        formData.append("industries[]", code.key.toString());
      });
    }
    if(consultingFieldList && consultingFieldList.length>0){
      consultingFieldList.forEach((field: any) => {
        formData.append("consulting_field[]", field.key.toString());
      });
    }
    if(otherIndustriesFields && otherIndustriesFields.length>0){
      otherIndustriesFields.forEach((field:any, index:number) => {
        formData.append(`suggest_industries[${index}][parent_id]`, field.parent.key ==="selectAll" ? 0 :field.parent.key);
      formData.append(`suggest_industries[${index}][name][en]`, field.data.customInput);
      formData.append(`suggest_industries[${index}][name][ar]`, field.data.customInput);
      });
    }
    if(otherConsultingFields && otherConsultingFields.length>0){
      otherConsultingFields.forEach((field:any, index:number) => {
        formData.append(`suggest_consulting_fields[${index}][parent_id]`, field.parent.key ==="selectAll" ? 0 :field.parent.key);
        formData.append(`suggest_consulting_fields[${index}][name][en]`, field.data.customInput);
        formData.append(`suggest_consulting_fields[${index}][name][ar]`, field.data.customInput);
      });
    }
    const certs = this.form.value.certificationsAdded;
    if (certs && certs.length > 0) {
      certs.forEach((cert: any, index: number) => {
        formData.append(`certification[${index}][type]`, cert.type);
        formData.append(`certification[${index}][file]`, cert.file);
      });
    }
    const formDataEntries: Array<{ key: string; value: string }> = [];
    formData.forEach((value, key) => {
      formDataEntries.push({ key, value: value.toString() });
    });

    // Call both profile and social networks update
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
  }

  submitSocialNetworks() {
    const social = [];
    const formValues = this.corporateInfoForm.value;

    if (formValues.linkedIn) {
      social.push({ type: 'linkedin', link: formValues.linkedIn });
    }
    if (formValues.facebook) {
      social.push({ type: 'facebook', link: formValues.facebook });
    }
    if (formValues.x) {
      social.push({ type: 'x', link: formValues.x });
    }
    if (formValues.instagram) {
      social.push({ type: 'instagram', link: formValues.instagram });
    }
    if (formValues.youtube) {
      social.push({ type: 'youtube', link: formValues.youtube });
    }

    return this._profilePost.addCompanySocial(social);
  }

  private handleServerErrors(error: any) {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          this.showError("", messages.join(", "));
        }
      }
    } else {
      this.showError("", "An unexpected error occurred.");
    }
  }
}

