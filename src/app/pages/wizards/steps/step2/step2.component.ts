import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild,AfterViewInit    } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subscription, fromEvent, map, startWith, forkJoin, of } from 'rxjs';
import { ICreateAccount } from '../../create-account.helper';
import { ConsultingField, ConsultingFieldsService } from 'src/app/_fake/services/admin-consulting-fields/consulting-fields.service';
import { Message } from 'primeng/api';
import { TranslationService } from 'src/app/modules/i18n';
import { IsicCodesService } from 'src/app/_fake/services/isic-code/isic-codes.service';
import { phoneNumbers } from 'src/app/pages/wizards/phone-keys';
import { IndustryService } from 'src/app/_fake/services/industries/industry.service';
import { ConsultingFieldTreeService } from 'src/app/_fake/services/consulting-fields-tree/consulting-fields-tree.service';
import { TreeNode } from 'src/app/reusable-components/shared-tree-selector/TreeNode';
@Component({
  selector: 'app-step2',
  templateUrl: './step2.component.html',
  styleUrl: './step2.component.scss'
})
export class Step2Component implements OnInit, OnDestroy  {
  isLoading$: Observable<boolean>;
  listOfConsultingFields: TreeNode[] = [];
  messages: Message[] = [];
  optionLabel: string = 'name.en';
  lang:string;
  phoneNumbers = phoneNumbers;
  nodes: TreeNode[] = [];
  selectedNodes: any;
  logoPreview: string | ArrayBuffer | null = null;
  @Input('updateParentModel') updateParentModel: (
    part: Partial<ICreateAccount>,
    isFormValid: boolean
  ) => void;
  form: FormGroup;
  @Input() defaultValues: Partial<ICreateAccount>;
  @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>;
  defaultImage = 'https://au.eragroup.com/wp-content/uploads/2018/02/logo-placeholder.png';
  private unsubscribe: Subscription[] = [];

  allConsultingFieldSelected  = []
  allIndustriesSelected  = []
  constructor(
    private fb: FormBuilder,
    private _ForsightaFieldsService: ConsultingFieldTreeService,
    private _translateion:TranslationService,
    private _isicService: IndustryService // Add this line
  ) {
    this.lang=this._translateion.getSelectedLanguage();
  }
 

  ngOnInit() {
    this.initApiCalls();
    this.initForm();
    this.updateParentModel({}, this.checkForm());
    this._translateion.onLanguageChange().subscribe((lang)=>{
      this.lang =lang;
      this.initApiCalls();
    });
    if (this.defaultValues?.registerDocument) {
      this.form.patchValue({ registerDocument: this.defaultValues?.registerDocument });
      this.form.get('registerDocument')?.markAsTouched();
      this.updateParentModel({ registerDocument: this.defaultValues?.registerDocument }, this.checkForm());
    }
    if(this.defaultValues?.logo){
      this.logoPreview =URL.createObjectURL(this.defaultValues.logo);
    }
  }

  initApiCalls() {
    this.isLoading$=of(true);
    const apiCalls = forkJoin({
      consultingFields: this._ForsightaFieldsService.getConsultingCodesTree(this.lang || 'en'),
      isicCodes: this._isicService.getIsicCodesTree(this.lang || 'en')
    }).subscribe({
      next: (results) => {
        this.listOfConsultingFields = results.consultingFields;
        this.nodes = results.isicCodes;
        this.isLoading$=of(false);
      },
      error: (err) => {
        this.messages = [];
        if (err.validationMessages) {
          this.messages = err.validationMessages;
        } else {
          this.messages.push({
            severity: 'error',
            summary: 'Error',
            detail: 'An unexpected error occurred.',
          });
          setTimeout(() => {
            this.messages = [];
          }, 4000);
          this.isLoading$=of(false);
        }
      }
    });
    this.unsubscribe.push(apiCalls);
  }

  // Optional: Additional handling to sanitize input
  onPhoneNumberInput(event: Event) {
      const input = event.target as HTMLInputElement;
      // Remove any non-digit characters
      let sanitizedValue = input.value.replace(/\D/g, '');
      // Limit to 10 digits
      if (sanitizedValue.length > 10) {
        sanitizedValue = sanitizedValue.slice(0, 10);
      }
      // Update the input value without triggering another event
      if(this.defaultValues.accountType==='corporate'){
          this.form.controls.phoneCompanyNumber.setValue(sanitizedValue, { emitEvent: false });
      }else{
        this.form.controls.phoneNumber.setValue(sanitizedValue, { emitEvent: false });
      }
  }
  getBackgroundImage(){
    return `url(${this.logoPreview || this.defaultImage})`;
  }
  onLogoSelected(event:Event){
    const input  =event.target as HTMLInputElement;
    if(input.files && input.files[0]){
      const file = input.files[0];
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      if(!validTypes.includes(file.type)){
        this.messages = [{
          severity: 'error',
          summary: 'Invalid File Type',
          detail: 'Please select a PNG or JPEG image.',
          id:'fileType'
        }];
        setTimeout(() => {
          this.messages = [];
        }, 4000);
        return
      };
      const maxSize = 2 *1024*1024 ; //2MB
      if(file.size > maxSize){
        this.messages = [{
          icon:'',
          severity: 'error',
          summary:this.lang ==='en' ? 'Logo must be smaller than 2MB.' : 'يجب أن يكون الحجم أقل من ٢ ميجا',
          detail:  '',
          id:'fizeSize'
        }];
        setTimeout(() => {
          this.messages = [];
        }, 4000);
        return;
      }
      this.form.patchValue({logo:file});
      this.updateParentModel({ logo: file }, this.checkForm());
      const reader = new FileReader();
      reader.onload = () => {
        this.logoPreview = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };
  removeLogo() {
    this.form.patchValue({ logo: null });
    this.logoPreview = null;
    this.updateParentModel({ logo: null }, this.checkForm());
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }
  
  onDropzoneClick() {
    this.fileInput.nativeElement.click();
  }
 
// Handle file selection from the file input
onFileSelected(event: any) {
  const file = event.target.files[0];
  if (file) {
    this.form.patchValue({ registerDocument: file });
    this.form.get('registerDocument')?.markAsTouched();
    this.updateParentModel({ registerDocument: file }, this.checkForm());
  }
}

// Prevent default drag over behavior
onDragOver(event: DragEvent) {
  event.preventDefault();
}

// Handle files dropped into the dropzone
onFileDrop(event: DragEvent) {
  event.preventDefault();
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    const file = files.item(0);
    this.form.patchValue({ registerDocument: file });
    this.form.get('registerDocument')?.markAsTouched();
    this.updateParentModel({ registerDocument: file }, this.checkForm());
  }


}

// Remove the uploaded register document
removeRegisterDocument() {
  this.form.patchValue({ registerDocument: null });
  this.updateParentModel({ registerDocument: null }, this.checkForm());
  this.fileInput.nativeElement.value =''
}

// Get the icon path based on the file extension
getFileIcon(file: File): string {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const iconPath = `./assets/media/svg/files/${extension}.svg`;
  // If the icon doesn't exist, you can return a default icon path
  return iconPath;
}

  onConsultingNodesSelected(event:any){
   this.allConsultingFieldSelected=event && event.length >0 ? event : [];
   this.form.get('consultingFields')?.setValue(this.allConsultingFieldSelected);
   this.updateParentModel({consultingFields:this.allConsultingFieldSelected}, this.checkForm());
 
  }

  onIndustrySelected(event: any) {
    this.allIndustriesSelected = event && event.length > 0 ? event : [];
    this.form.get('isicCodes')?.setValue(this.allIndustriesSelected);
    this.updateParentModel({isicCodes:this.allIndustriesSelected}, this.checkForm());
   
  }
  

  initForm() {
    const accountType = this.defaultValues.accountType;
    if (accountType === 'personal') {
      this.form = this.fb.group({
        bio: [this.defaultValues.bio || '', [Validators.required]],
        phoneCountryCode: [this.defaultValues.phoneCountryCode || ''],
        phoneNumber: [
          this.defaultValues.phoneNumber || '',
          [
            Validators.minLength(10),
            Validators.pattern('^[0-9]{10}$'), // Ensures exactly 10 digits
          ],
        ],
        consultingFields: [this.defaultValues.consultingFields || [], [Validators.required]],
        isicCodes: [this.defaultValues.isicCodes  || [], [Validators.required]],
      });
    } else {
      this.form = this.fb.group(
        {
          legalName: [this.defaultValues.legalName || '', [Validators.required]],
          companyAddress: [this.defaultValues.companyAddress || '', [Validators.required]],
          aboutCompany: [this.defaultValues.aboutCompany || '', [Validators.required]],
          phoneCountryCode: [this.defaultValues.phoneCountryCode || ''],
          phoneCompanyNumber: [
            this.defaultValues.phoneCompanyNumber || '',
            [
              Validators.required,
              Validators.minLength(10),
              Validators.pattern('^[0-9]{10}$'), // Ensures exactly 10 digits
            ],
          ],
          consultingFields: [this.defaultValues.consultingFields || [], [Validators.required]],
          isicCodes: [this.defaultValues.isicCodes || [], [Validators.required]],
          logo: [this.defaultValues.logo || null, [Validators.required]],
        }
      );
    }
    

    const formChangesSubscr = this.form.valueChanges.subscribe((val) => {
      this.updateParentModel(val, this.checkForm());
    });
    this.unsubscribe.push(formChangesSubscr);
  }

onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.form.patchValue({ registerDocument: file });
      this.updateParentModel({ registerDocument: file }, this.checkForm());
    }
  }
  checkForm() {
    return this.form.valid;
  }

  get fizeSizeMessages() {
    // Return only the messages with the ID 'fizeSize'
    return this.messages.filter((message) => message.id === 'fizeSize');
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }

}
