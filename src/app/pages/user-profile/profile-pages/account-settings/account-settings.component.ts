import {
  Component,
  ElementRef,
  Injector,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormBuilder, FormGroup, FormArray, Validators } from "@angular/forms";
import { Message, TreeNode } from "primeng/api";
import { Observable, catchError, forkJoin, of, switchMap, tap } from "rxjs";
import { CertificationService } from "src/app/_fake/services/certifications/certification.service";
import { CountryService } from "src/app/_fake/services/countries-api/countries-get.service";
import { DocumentsService } from "src/app/_fake/services/douments-types/documents-types.service.spec";
import { AuthService } from "src/app/modules/auth";
import { BaseComponent } from "src/app/modules/base.component";
import { TranslationService } from "src/app/modules/i18n";
import Swal from "sweetalert2"; // Import Swal
import { phoneNumbers } from "src/app/pages/wizards/phone-keys";
import { UpdateProfileService } from "src/app/_fake/services/profile/profile.service";
import { DialogService } from "primeng/dynamicdialog";
import { UpgradeToCompanyComponent } from "./upgrade-to-company/upgrade-to-company.component";
import { IndustryService } from "src/app/_fake/services/industries/industry.service";
import { ConsultingFieldTreeService } from "src/app/_fake/services/consulting-fields-tree/consulting-fields-tree.service";

interface Certification {
  id: number;
  name: string;
  type: string;
  url: string;
}

@Component({
  selector: "app-account-settings",
  templateUrl: "./account-settings.component.html",
  styleUrls: ["./account-settings.component.scss"],
  providers: [DialogService],
})
export class AccountSettingsComponent extends BaseComponent implements OnInit {
  profile: any;
  accountForm: FormGroup;
  roles: string[] = [];
  lang: string = "en";
  countries: any[] = [];
  isicCodes: any[] = [];
  selectedIsicNodes: any;
  isLoadingIsicCodes: boolean = true;
  isISICDialogVisible: boolean = false;
  consultingFields: any[] = [];
  phoneNumbers: any[] = phoneNumbers; // For country codes
  documentTypes: any[] = [];
  reverseLoader: boolean = false;
  isLoadingCountries: boolean = true;
  nodes: TreeNode[] = [];
  selectedNodes: any;
  isLoadingConsultingFields: boolean = true;
  isLoadingISIC$: Observable<boolean>;
  optionLabel: string;
  form: FormGroup;
  isLoadingDocumentTypes: boolean = true;
  certifications: Certification[] = [];
  loadingData: boolean = false;
  messages: Message[] = [];
  dialogWidth: string = "50vw";
  onSuccessMessage: boolean = false;
  isUpdatingProfile$: Observable<any>;
  displayLoadingDialog: boolean = false;
  showCorporateUpgrade: boolean = false;
  @ViewChild("fileInput") fileInput: ElementRef<HTMLInputElement>;
  @ViewChild("fileInputRegistry")
  fileInputRegistry: ElementRef<HTMLInputElement>;
  allConsultingFieldSelected: any;
  allIndustriesSelected: any;
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private translationService: TranslationService,
    private countryService: CountryService,
    private isicService: IndustryService,
    private consultingFieldService: ConsultingFieldTreeService,
    private documentsService: DocumentsService,
    private certificationService: CertificationService,
    private _profilePost: UpdateProfileService,
    private dialogService: DialogService,
    injector: Injector
  ) {
    super(injector);
    this.isLoadingISIC$ = this.isicService.isLoading$;
    this.isUpdatingProfile$ = this._profilePost.isLoading$;
  }

  ngOnInit(): void {
    this.handleLanguage();
    this.handleApiCalls();
    const subscription = this.isUpdatingProfile$.subscribe((isUpdating) => {
      this.displayLoadingDialog = isUpdating;
    });
    this.unsubscribe.push(subscription);
  }
  handleApiCalls() {
    this.loadingData = true;
    forkJoin({
      countries: this.loadCountries(),
      isicCodes: this.loadIsicCodes(),
      consultingFields: this.loadConsultingFields(),
      documentTypes: this.loadDocumentTypes(), // Ensure this is included
    })
      .pipe(
        switchMap(() => this.getProfile()) // Wait for data loading, then get profile
      )
      .subscribe({
        next: () => {
          this.initForm(); // Initialize form here
          this.populateForm(); // Now documentTypes is loaded
        },
        error: (err) => {},
      });
  }
  initForm() {
    if (
      this.hasRole(["client"]) &&
      !this.hasRole(["insighter"]) &&
      !this.hasRole(["company"])
    ) {
      console.log("this.client", this.profile);
      this.accountForm = this.fb.group({
        first_name: ["", Validators.required],
        last_name: ["", Validators.required],
        country: ["", Validators.required],
      });
    } else if (
      this.profile.roles.includes("insighter") &&
      !this.profile.roles.includes("company")
    ) {
      this.accountForm = this.fb.group({
        first_name: ["", Validators.required],
        last_name: ["", Validators.required],
        country: ["", Validators.required],
        bio: [""],
        phoneNumber: [""],
        isicCodes: [[], Validators.required],
        consultingFields: [[], Validators.required],
      });
      this.form = this.fb.group({
        certificationsAdded: this.fb.array([]),
      });
    } else if (this.profile.roles.includes("company")) {
      this.accountForm = this.fb.group({
        first_name: ["", Validators.required],
        last_name: ["", Validators.required],
        country: [""],
        bio: [""],
        about_us: [""],
        phoneNumber: [""],
        isicCodes: [[], Validators.required],
        consultingFields: [[], Validators.required],
        legal_name: [""],
        website: [""],
        registerDocument: [null],
      });
      this.form = this.fb.group({
        certificationsAdded: this.fb.array([]),
      });
    }
  }
  openUpgradeDialog() {
    const ref = this.dialogService.open(UpgradeToCompanyComponent, {
      header: "Upgrade to Corporate Account",
      width: "50%",
      contentStyle: { "max-height": "500px", overflow: "auto" },
      baseZIndex: 10000,
    });

    ref.onClose.subscribe((result) => {
      if (result) {
        // Handle the result if needed
      }
    });
  }
   onConsultingNodesSelected(selectedNodes: any) {
    this.allConsultingFieldSelected = selectedNodes && selectedNodes.length > 0 ? selectedNodes : [];
    this.accountForm.get('consultingFields')?.setValue(this.allConsultingFieldSelected);
    // If you have a function to update a parent model or handle form validity:
    // this.updateParentModel({ consultingFields: this.allConsultingFieldSelected }, this.checkForm());
  }

  onIndustrySelected(selectedNodes: any) {
    this.allIndustriesSelected = selectedNodes && selectedNodes.length > 0 ? selectedNodes : [];
    this.accountForm.get('isicCodes')?.setValue(this.allIndustriesSelected);
    // Similarly, update parent model if needed:
    // this.updateParentModel({ isicCodes: this.allIndustriesSelected }, this.checkForm());
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
  getProfile(): Observable<any> {
    return this.authService.getProfile().pipe(
      tap((profile) => {
        this.profile = profile;
        this.roles = profile.roles;
        this.loadingData = false;
        console.log("Profile", this.profile);
      })
    );
  }
  populateForm() {
    this.loadingData = false;
    if (
      this.hasRole(["client"]) &&
      !this.hasRole(["insighter"]) &&
      !this.hasRole(["company"])
    ) {
      this.accountForm.patchValue({
        first_name: this.profile.first_name,
        last_name: this.profile.last_name,
        country: this.profile.country_id
          ? this.countries.find(
              (country) => country.id === this.profile.country_id
            )
          : null,
      });
    } else {
      // Recursive function to transform nodes to TreeNode format
      const transformNodes = (nodes: any[]): any[] => {
        return nodes.map(node => ({
          key: node.id,
          label: this.lang === 'ar' ? node.name : node.names.en,
          data: { 
            key: node.id,
            code: node.code,
            status: node.status,
            nameEn: node.names.en,
            nameAr: node.names.ar,
          },
          children: node.children ? transformNodes(node.children) : []
        }));
      };

      const transformedIsicCodes = transformNodes(this.profile.industries);
      const transformedConsultingFields = transformNodes(this.profile.consulting_field);

      this.accountForm.patchValue({
        first_name: this.profile.first_name,
        last_name: this.profile.last_name,
        country: this.profile.country_id
          ? this.countries.find(
              (country) => country.id === this.profile.country_id
            )
          : null,
        bio: this.profile.bio,
        about_us: this.profile.company?.about_us,
        phoneNumber: this.profile.phone ? this.profile.phone : null,
        isicCodes: transformedIsicCodes,
        consultingFields: transformedConsultingFields,
        legal_name: this.profile.company?.legal_name,
        website: this.profile.company?.website,
      });
      this.certifications = this.profile.certifications
        ? this.profile.certifications
        : [];
      this.selectDefaultIsicCodes();
    }
  }
  handleLanguage() {
    this.lang = this.translationService.getSelectedLanguage();
    this.translationService.onLanguageChange().subscribe((lang) => {
      this.lang = lang;
      this.handleApiCalls();
    });
  }
  loadCountries(): Observable<any[]> {
    return this.countryService.getCountries().pipe(
      tap((countries) => {
        this.countries = countries.map((country: any) => ({
          ...country,
          flagPath: `assets/media/flags/${country.flag}.svg`,
          showFlag: true,
        }));
        console.log("countries", this.countries);
        this.isLoadingCountries = false;
      }),
      catchError((err) => {
        this.isLoadingCountries = false;
        return of([]); // Return an empty array or handle as needed
      })
    );
  }
  onFlagError(country: any) {
    country.showFlag = false; // Hide the flag image if it fails to load
  }
  onISICDialogCancel() {
    this.isISICDialogVisible = false;
  }
  onISICDialogOK() {
    this.isISICDialogVisible = false;
    // Update the form control 'isicCodes' with selected nodes
    const selectedIsicCodes = this.selectedNodes.map((node: any) => node);
    this.accountForm.get("isicCodes")?.setValue(selectedIsicCodes);
    this.accountForm.get("isicCodes")?.markAsTouched();
  }
  selectedNodesLabel(): string {
    if (this.selectedNodes && this.selectedNodes.length > 0) {
      return this.selectedNodes.map((node: any) => node.label).join(", ");
    } else {
      return "";
    }
  }
  loadIsicCodes(): Observable<any> {
    this.reverseLoader = true;
    return this.isicService.getIsicCodesTree(this.lang).pipe(
      tap((codes) => {
        this.isicCodes = codes;
        this.isLoadingIsicCodes = false;
      }),
      catchError((error) => {
        this.isLoadingIsicCodes = false;
        this.reverseLoader = false;
        return of([]);
      })
    );
  }
  selectDefaultIsicCodes() {
    this.reverseLoader = true;
    this.selectedNodes = [];
    const codesToSelect = this.profile.industries.map((node: any) => node.id);
    const traverse = (nodes: any[], parentNode: any = null) => {
      nodes.forEach((node: any) => {
        node.parent = parentNode; // Set the parent property

        if (codesToSelect.includes(node.data.key)) {
          this.selectedNodes.push(node);
          node.selected = true; // Mark the node as selected
        }

        if (node.children && node.children.length) {
          traverse(node.children, node);

          // Update parent node selection state based on child nodes
          const allChildrenSelected = node.children.every(
            (child: any) => child.selected
          );
          const someChildrenSelected = node.children.some(
            (child: any) => child.selected || child.partialSelected
          );

          if (allChildrenSelected) {
            node.selected = true;
            node.partialSelected = false;
          } else if (someChildrenSelected) {
            node.selected = false;
            node.partialSelected = true;
          } else {
            node.selected = false;
            node.partialSelected = false;
          }
        }
      });
    };
    console.log("this", this.isicCodes);
    traverse(this.isicCodes);
    this.reverseLoader = false;
  }
  gerCertName(certId: string) {
    const doc = this.documentTypes.find((cert) => cert.id === certId);
    return doc.name;
  }
  showISICDialog() {
    this.isISICDialogVisible = true;
  }
  closeISICDialog() {
    this.isISICDialogVisible = false;
  }
  confirmISICSelection() {
    // Update the form control with selected ISIC codes
    const selectedCodes = this.selectedIsicNodes.map(
      (node: any) => node.data.key
    );
    this.accountForm.get("isicCodes")?.setValue(selectedCodes);
    this.isISICDialogVisible = false;
  }
  selectedIsicLabels(): string {
    // Return a string representation of selected ISIC codes
    return this.selectedIsicNodes.map((node: any) => node.label).join(", ");
  }
  findIsicNodesByKeys(keys: string[]): any[] {
    return [];
  }
  loadConsultingFields(): Observable<any[]> {
    return this.consultingFieldService.getConsultingCodesTree(this.lang ? this.lang : 'en').pipe(
      tap((fields) => {
        this.consultingFields = fields;
        console.log("Consulting Fields From API", this.consultingFields);
        this.isLoadingConsultingFields = false;
      }),
      catchError((err) => {
        this.isLoadingConsultingFields = false;
        return of([]);
      })
    );
  }
  loadPhoneNumbers() {
    // Already loaded from phoneNumbers import
  }
  loadDocumentTypes(): Observable<any[]> {
    return this.documentsService.getDocumentsTypes().pipe(
      tap((types) => {
        this.documentTypes = types;
        this.isLoadingDocumentTypes = false;
      }),
      catchError((err) => {
        this.isLoadingDocumentTypes = false;
        return of([]);
      })
    );
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
  getInvalidControls(
    formGroup: FormGroup | FormArray,
    parentKey: string = ""
  ): string[] {
    let invalidControls: string[] = [];

    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      const controlName = parentKey ? `${parentKey}.${key}` : key;

      if (control instanceof FormGroup || control instanceof FormArray) {
        invalidControls = invalidControls.concat(
          this.getInvalidControls(control, controlName)
        );
      } else if (control && control.invalid) {
        invalidControls.push(controlName);
      }
    });

    return invalidControls;
  }
  get isSubmitDisabled(): boolean {
    if (this.accountForm.invalid) {
      return true;
    }

    if (this.hasRole(["insighter", "company"])) {
      return this.certificationsAdded.controls.some(
        (control) => control.get("type")?.invalid
      );
    }

    return false;
  }
  getFileIcon(url: string): string {
    if (url) {
      const extension = url.split(".").pop()?.toLowerCase();
      const iconPath = `assets/media/svg/files/${extension}.svg`;
      return iconPath;
    }
    return "assets/media/svg/files/default.svg";
  }
  hasRole(requiredRoles: string[]): boolean {
    return requiredRoles.some((role) => this.roles.includes(role));
  }
  onDropzoneClickRegistry() {
    this.fileInputRegistry.nativeElement.click();
  }
  onFileSelectedRegistry(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.accountForm.patchValue({ registerDocument: file });
      this.accountForm.get("registerDocument")?.markAsTouched();
    }
  }
  onFileDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files.item(0);
      this.accountForm.patchValue({ registerDocument: file });
      this.accountForm.get("registerDocument")?.markAsTouched();
    }
  }
  onDragOver(event: DragEvent) {
    event.preventDefault();
  }
  // Remove the uploaded register document
  removeRegisterDocument() {
    this.form.patchValue({ registerDocument: null });
    this.fileInputRegistry.nativeElement.value = "";
  }

  
  // Form Submission
  onSubmit() {
    if (this.isSubmitDisabled) {
      // Optionally, display a message or handle the disabled state
      return;
    }
    if (
      this.hasRole(["client"]) &&
      !this.hasRole(["company"]) &&
      !this.hasRole(["insighter"])
    ) {
      const formData = new FormData();
      formData.append("first_name", this.accountForm.get("first_name")?.value);
      formData.append("last_name", this.accountForm.get("last_name")?.value);
      if (this.accountForm.get("country")?.value) {
        formData.append(
          "country_id",
          this.accountForm.get("country")?.value.id
        );
      }
      this.postProfileAPI(formData);
    }
    if (this.hasRole(["insighter"])) {


      const formData = new FormData();
      formData.append("first_name", this.accountForm.get("first_name")?.value);
      formData.append("last_name", this.accountForm.get("last_name")?.value);
      if (this.accountForm.get("country")?.value) {
        formData.append(
          "country_id",
          this.accountForm.get("country")?.value.id
        );
      }
      formData.append("bio", this.accountForm.get("bio")?.value);
      const user = this.accountForm.value;
      const industriesList = user.isicCodes.filter((node: any) => typeof node.key === 'number');
      const otherIndustriesFields = user.isicCodes.filter(
        (node: any) =>
          typeof node.key === 'string' &&
          node.key !== 'selectAll' &&
          node.data?.customInput
      );
  
      const consultingFieldList = user.consultingFields.filter((node: any) => typeof node.key === 'number');
      const otherConsultingFields = user.consultingFields.filter(
        (node: any) =>
          typeof node.key === 'string' &&
          node.key !== 'selectAll' &&
          node.data?.customInput
      );

      if (this.accountForm.get("phoneNumber")?.value) {
        formData.append("phone", this.accountForm.get("phoneNumber")?.value);
      }
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
      console.table(formDataEntries);
      this.postProfileAPI(formData);
    }
    if (this.hasRole(["company"])) {
      const formData = new FormData();
      formData.append("first_name", this.accountForm.get("first_name")?.value);
      formData.append("last_name", this.accountForm.get("last_name")?.value);
      if (this.accountForm.get("country")?.value) {
        formData.append(
          "country_id",
          this.accountForm.get("country")?.value.id
        );
      }
      formData.append("about_us", this.accountForm.get("about_us")?.value);
      if (this.accountForm.get("bio")?.value) {
        formData.append("bio", this.accountForm.get("bio")?.value);
      }
      if (this.accountForm.get("phoneNumber")?.value) {
        formData.append("phone", this.accountForm.get("phoneNumber")?.value);
      }
      formData.append("legal_name", this.accountForm.get("legal_name")?.value);
      if (this.accountForm.get("website")?.value) {
        formData.append("website", this.accountForm.get("website")?.value);
      }
      const user = this.accountForm.value;
      const industriesList = user.isicCodes.filter((node: any) => typeof node.key === 'number');
      const otherIndustriesFields = user.isicCodes.filter(
        (node: any) =>
          typeof node.key === 'string' &&
          node.key !== 'selectAll' &&
          node.data?.customInput
      );
  
      const consultingFieldList = user.consultingFields.filter((node: any) => typeof node.key === 'number');
      const otherConsultingFields = user.consultingFields.filter(
        (node: any) =>
          typeof node.key === 'string' &&
          node.key !== 'selectAll' &&
          node.data?.customInput
      );

      if (this.accountForm.get("phoneNumber")?.value) {
        formData.append("phone", this.accountForm.get("phoneNumber")?.value);
      }
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
      if (this.accountForm.get("registerDocument")?.value) {
        formData.append(
          "register_document",
          this.accountForm.get("registerDocument")?.value
        );
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
      console.table(formDataEntries);
      this.postProfileAPI(formData);
    }
  }

  postProfileAPI(formData: FormData) {
    const postprofileAPISub = this._profilePost
      .postProfile(formData)
      .subscribe({
        next: (res) => {
          this.onSuccessMessage = true;
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
    this.messages = [];
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          this.messages.push({
            severity: "error",
            summary: "",
            detail: messages.join(", "),
          });
        }
      }
    } else {
      this.messages.push({
        severity: "error",
        summary: "Error",
        detail: "An unexpected error occurred.",
      });
    }
  }
}
