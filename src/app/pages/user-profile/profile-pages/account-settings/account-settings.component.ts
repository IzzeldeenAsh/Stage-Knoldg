import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Message, MessageService, TreeNode } from 'primeng/api';
import { Observable, catchError, forkJoin, of, switchMap, tap } from 'rxjs';
import { ConsultingFieldsService } from 'src/app/_fake/services/admin-consulting-fields/consulting-fields.service';
import { CertificationService } from 'src/app/_fake/services/certifications/certification.service';
import { CountryService } from 'src/app/_fake/services/countries-api/countries-get.service';
import { DocumentsService } from 'src/app/_fake/services/douments-types/documents-types.service.spec';
import { ScrollAnimsService } from 'src/app/_fake/services/scroll-anims/scroll-anims.service';
import { AuthService } from 'src/app/modules/auth';
import { BaseComponent } from 'src/app/modules/base.component';
import { TranslationService } from 'src/app/modules/i18n';
import Swal from 'sweetalert2'; // Import Swal
import { phoneNumbers } from 'src/app/pages/wizards/phone-keys';
import { IsicCodesService } from 'src/app/_fake/services/isic-code/isic-codes.service';
interface Certification {
  id: number;
  name: string;
  type: string;
  url: string;
}

@Component({
  selector: 'app-account-settings',
  templateUrl: './account-settings.component.html',
  styleUrls: ['./account-settings.component.scss']
})
export class AccountSettingsComponent extends BaseComponent implements OnInit {
  profile: any;
  accountForm: FormGroup;
  roles: string[] = [];
  lang: string = 'en';
  countries: any[] = [];
  isicCodes: any[] = [];
  selectedIsicNodes: any;
  isLoadingIsicCodes: boolean = true;
  isISICDialogVisible: boolean = false;
  consultingFields: any[] = [];
  phoneNumbers: any[] = phoneNumbers; // For country codes
  documentTypes: any[] = [];
  reverseLoader:boolean=false;
  isLoadingCountries: boolean = true;
  nodes: TreeNode[] = [];
  selectedNodes: any;
  isLoadingConsultingFields: boolean = true;
  isLoadingISIC$: Observable<boolean>;
  optionLabel:string;
  form: FormGroup;
  isLoadingDocumentTypes: boolean = true;
  certifications:Certification[]=[];
  loadingData:boolean=false;
  messages: Message[] = [];
  dialogWidth: string = '50vw';
  @ViewChild("fileInput") fileInput: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private translationService: TranslationService,
    private countryService: CountryService,
    private isicService: IsicCodesService,
    private consultingFieldService: ConsultingFieldsService,
    private documentsService: DocumentsService,
    private certificationService:CertificationService,
    scrollAnims: ScrollAnimsService,
    messageService: MessageService // Inject MessageService
  ) {
    super(scrollAnims,messageService);
    this.isLoadingISIC$ = this.isicService.isLoading$
  }

  ngOnInit(): void {
    this.handleLanguage();
    this.handleApiCalls();

  }
  handleApiCalls(){
    this.loadingData=true;
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
        error: (err) => {
        },
      });
  }
  
  initForm() {
   
    if(this.hasRole(['client']) && !this.hasRole(['insighter']) && !this.hasRole(['company'])){
      console.log('this.client',this.profile);
      this.accountForm = this.fb.group({
        first_name: ['', Validators.required],
        last_name: ['', Validators.required],
        country: ['', Validators.required],
      });
    }else if (this.profile.roles.includes('insighter') && !this.profile.roles.includes('company')){
      this.accountForm = this.fb.group({
        first_name: ['', Validators.required],
        last_name: ['', Validators.required],
        country: ['', Validators.required],
        bio: [''],
        phoneNumber: ['', [Validators.pattern(/^\d{10}$/)]],
       isicCodes: [[], Validators.required],
        consultingFields: [[], Validators.required],
        
      });
  
      this.form = this.fb.group({
        certificationsAdded: this.fb.array([]),
      });
    } else if(this.profile.roles.includes('company')){
      this.accountForm = this.fb.group({
        first_name: ['', Validators.required],
        last_name: ['', Validators.required],
        country: ['', Validators.required],
        about_us: [''],
        phoneNumber: ['', [Validators.pattern(/^\d{10}$/)]],
       isicCodes: [[], Validators.required],
        consultingFields: [[], Validators.required],
        legal_name: [''],
        website: [''],
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


// Method to fetch user profile
getProfile(): Observable<any> {
  return this.authService.getProfile().pipe(
    tap((profile) => {
      this.profile = profile;
      this.roles = profile.roles;
      this.loadingData=false;
      console.log("Profile", this.profile);
    })
  );
}


populateForm() {
  this.loadingData=false;
  // Populate the form with profile data
  this.accountForm.patchValue({
    first_name: this.profile.first_name,
    last_name: this.profile.last_name,
    country: this.profile.country_id
      ? this.countries.find((country) => country.id === this.profile.country_id)
      : null,
    bio: this.profile.bio,
    about_us: this.profile.company?.about_us,
    // phoneCountryCode: this.profile.phoneCountryCode,
    phoneNumber: this.profile.phoneNumber,
     isicCodes: this.profile.industries,
    consultingFields: this.profile.consulting_field,
    legal_name: this.profile.company?.legal_name,
    website: this.profile.company?.website,
  });
  this.certifications = this.profile.certifications ? this.profile.certifications :[]
  this.selectDefaultIsicCodes()
}


  handleLanguage() {
    this.lang = this.translationService.getSelectedLanguage();
    this.translationService.onLanguageChange().subscribe((lang) => {
      this.lang = lang;
      this.handleApiCalls()
     
    });
  }

  // Country Selection
  loadCountries(): Observable<any[]> {
    return this.countryService.getCountries().pipe(
      tap((countries) => {
        this.countries = countries.map((country: any) => ({
          ...country,
          flagPath: `assets/media/flags/${country.flag}.svg`,
          showFlag: true,
        }));
        this.isLoadingCountries = false;
      }),
      catchError((err) => {
        this.isLoadingCountries = false;
        return of([]); // Return an empty array or handle as needed
      })
    );
  }
  

  onFlagError(country:any) {
    country.showFlag = false; // Hide the flag image if it fails to load
  }
  onISICDialogCancel() {
    this.isISICDialogVisible = false;
  }
  onISICDialogOK() {
    this.isISICDialogVisible = false;
    // Update the form control 'isicCodes' with selected nodes
    const selectedIsicCodes = this.selectedNodes.map((node: any) => node);
    this.accountForm.get('isicCodes')?.setValue(selectedIsicCodes);
    this.accountForm.get('isicCodes')?.markAsTouched();
  }
  selectedNodesLabel(): string {
    if (this.selectedNodes && this.selectedNodes.length > 0) {
      return this.selectedNodes.map((node: any) => node.label).join(', ');
    } else {
      return '';
    }
  }  
  // ISIC Codes
  loadIsicCodes():Observable<any> {
    this.reverseLoader=true;
   return  this.isicService.getIsicCodesTree().pipe(
    tap((codes)=>{
      this.isicCodes = codes;
      this.isLoadingIsicCodes = false;
    
    }),
    catchError((error)=>{
      this.isLoadingIsicCodes = false;
      this.reverseLoader=false;
      return of([]);
    })
   )
  }

  selectDefaultIsicCodes() {
    this.reverseLoader=true;
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
          const allChildrenSelected = node.children.every((child: any) => child.selected);
          const someChildrenSelected = node.children.some((child: any) => child.selected || child.partialSelected);
  
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
    console.log("this",this.isicCodes);
    traverse(this.isicCodes);
    this.reverseLoader=false;
  }
  
  gerCertName(certId:string){
   const doc =  this.documentTypes.find((cert)=>cert.id ===certId);
   return doc.name
  }
  showISICDialog() {
    this.isISICDialogVisible = true;
  }

  closeISICDialog() {
    this.isISICDialogVisible = false;
  }

  confirmISICSelection() {
    // Update the form control with selected ISIC codes
    const selectedCodes = this.selectedIsicNodes.map((node:any) => node.data.key);
    this.accountForm.get('isicCodes')?.setValue(selectedCodes);
    this.isISICDialogVisible = false;
  }

  selectedIsicLabels(): string {
    // Return a string representation of selected ISIC codes
    return this.selectedIsicNodes.map((node:any) => node.label).join(', ');
  }

  findIsicNodesByKeys(keys: string[]): any[] {
    // Implement a method to find nodes in the tree by keys
    // This depends on your data structure
    return [];
  }

  // Consulting Fields
  loadConsultingFields(): Observable<any[]> {
    return this.consultingFieldService.getConsultingFields().pipe(
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

  // Phone Numbers (country codes)
  loadPhoneNumbers() {
    // Already loaded from phoneNumbers import
  }

  get phoneNumberInvalid(): boolean {
    const phoneControl = this.accountForm.get('phoneNumber');
    if(phoneControl){
      return phoneControl.invalid && phoneControl?.touched;
    }else{return false}
   
  }

  onPhoneNumberInput(event: Event) {
    const input = event.target as HTMLInputElement;
    let sanitizedValue = input.value.replace(/\D/g, '');
    if (sanitizedValue.length > 10) {
      sanitizedValue = sanitizedValue.slice(0, 10);
    }
    this.accountForm.controls.phoneNumber.setValue(sanitizedValue, { emitEvent: false });
  }

  // Document Types
 
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


// src/app/components/your-component/your-component.component.ts

removeCertification(index: number): void {
  const certification = this.certifications[index];

  if (!certification || !certification.id) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Invalid certification.',
    });
    return;
  }

  Swal.fire({
    title: 'Are you sure?',
    text: `Are you sure you want to delete the certification "${certification.name}"?`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6', // Customize as needed
    cancelButtonColor: '#d33',
    confirmButtonText: 'Yes, delete it!',
    cancelButtonText: 'Cancel'
  }).then((result) => {
    if (result.isConfirmed) {
      // Proceed with deletion
      this.certificationService.deleteCertification(certification.id).subscribe({
        next: (response) => {
          this.certifications.splice(index, 1);
          // Show success message
        this.showSuccess("Certificate Deleted Successfully")
        },
        error: (error) => {
          this.showError('Failed to delete certification.')
        }
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
get isSubmitDisabled():boolean{
  if(this.accountForm.invalid){
    return true
  }

  if(this.hasRole(['insighter','company'])){
    return this.certificationsAdded.controls.some(control=>control.get('type')?.invalid)
  }

  return false
}
  getFileIcon(url: string): string {
    if (url) {
      const extension = url.split('.').pop()?.toLowerCase();
      const iconPath = `assets/media/svg/files/${extension}.svg`;
      return iconPath;
    }
    return 'assets/media/svg/files/default.svg';
  }

  // Roles
  hasRole(requiredRoles: string[]): boolean {
    return requiredRoles.some(role => this.roles.includes(role));
  }



  // Form Submission
  onSubmit() {
    if (this.isSubmitDisabled) {
      // Optionally, display a message or handle the disabled state
      return;
    }
    if(this.hasRole(['client']) && !this.hasRole(['company']) && !this.hasRole(['insighter'])){
      const formData = new FormData();
      formData.append("first_name", this.accountForm.get('first_name')?.value);
      formData.append("last_name", this.accountForm.get('last_name')?.value);
      formData.append("country_id", this.accountForm.get('country_id')?.value.id);
    }
    if(this.hasRole(['insighter'])){
      const formData = new FormData();
      formData.append("first_name", this.accountForm.get('first_name')?.value);
      formData.append("last_name", this.accountForm.get('last_name')?.value);
      formData.append("country_id", this.accountForm.get('country_id')?.value.id);
      formData.append("bio", this.accountForm.get('bio')?.value);
     if(this.accountForm.get('phoneNumber')?.value){
      formData.append("phoneNumber", this.accountForm.get('phoneNumber')?.value);
     }
      this.accountForm.get('isicCodes')?.value.forEach((code: any) => {
        formData.append("industries[]", code.id.toString());
      });
      this.accountForm.get('consultingFields')?.value.forEach((field: any) => {
        formData.append("consulting_field[]", field.id.toString());
      });
      const certs = this.form.value.certificationsAdded
      if (certs && certs.length > 0) {
        certs.forEach((cert:any, index:number) => {
          formData.append(
            `certification[${index}][type]`,
            cert.type
          );
          formData.append(
            `certification[${index}][file]`,
            cert.file
          );
        });
      }
      const formDataEntries: Array<{ key: string; value: string }> = [];
      formData.forEach((value, key) => {
        formDataEntries.push({ key, value: value.toString() });
      });
      console.table(formDataEntries);
    }
    if(this.hasRole(['company'])){
      const formData = new FormData();
      formData.append("first_name", this.accountForm.get('first_name')?.value);
      formData.append("last_name", this.accountForm.get('last_name')?.value);
      formData.append("country_id", this.accountForm.get('country')?.value.id);
      formData.append("about_us", this.accountForm.get('about_us')?.value);
      if(this.accountForm.get('phoneNumber')?.value){
        formData.append("phoneNumber", this.accountForm.get('phoneNumber')?.value);
       }
      formData.append("legal_name", this.accountForm.get('legal_name')?.value);
      if( this.accountForm.get('website')?.value){
        formData.append("website", this.accountForm.get('website')?.value);
      }
      this.accountForm.get('isicCodes')?.value.forEach((code: any) => {
        formData.append("industries[]", code.id.toString());
      });
      this.accountForm.get('consultingFields')?.value.forEach((field: any) => {
        formData.append("consulting_field[]", field.id.toString());
      });
      const certs = this.form.value.certificationsAdded
      if (certs && certs.length > 0) {
        certs.forEach((cert:any, index:number) => {
          formData.append(
            `certification[${index}][type]`,
            cert.type
          );
          formData.append(
            `certification[${index}][file]`,
            cert.file
          );
        });
      }
      const formDataEntries: Array<{ key: string; value: string }> = [];
      formData.forEach((value, key) => {
        formDataEntries.push({ key, value: value.toString() });
      });
      console.table(formDataEntries);
    }
    // Proceed with form submission
    console.log(this.accountForm.value);
    console.log('certs',this.form.value);
    // Implement your submission logic her
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
