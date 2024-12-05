import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subscription, fromEvent, map, startWith } from 'rxjs';
import { ICreateAccount } from '../../create-account.helper';
import { ConsultingField, ConsultingFieldsService } from 'src/app/_fake/services/admin-consulting-fields/consulting-fields.service';
import { Message, TreeNode } from 'primeng/api';
import { TranslationService } from 'src/app/modules/i18n';
import { IsicCodesService } from 'src/app/_fake/services/isic-code/isic-codes.service';
import { phoneNumbers } from 'src/app/pages/wizards/phone-keys';
import { IndustryService } from 'src/app/_fake/services/industries/industry.service';
@Component({
  selector: 'app-step2',
  templateUrl: './step2.component.html',
  styleUrl: './step2.component.scss'
})
export class Step2Component implements OnInit, OnDestroy {
  isLoadingConsultingFields$: Observable<boolean>;
  isLoadingISIC$: Observable<boolean>;
  phoneMask: string = '000-000-0000'; // Default mask
  listOfConsultingFields: ConsultingField[] = [];
  messages: Message[] = [];
  optionLabel: string = 'name.en';
  lang:string;
  phoneNumbers = phoneNumbers;
  isISICDialogVisible: boolean = false;
  dialogWidth: string = '50vw';
  nodes: TreeNode[] = [];
  selectedNodes: any;
  reverseLoader:boolean=false;
  logoPreview: string | ArrayBuffer | null = null;
  @Input('updateParentModel') updateParentModel: (
    part: Partial<ICreateAccount>,
    isFormValid: boolean
  ) => void;
  form: FormGroup;
  @Input() defaultValues: Partial<ICreateAccount>;
  @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>;
  resizeSubscription!: Subscription;
  defaultImage = 'https://au.eragroup.com/wp-content/uploads/2018/02/logo-placeholder.png';
  private unsubscribe: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private _ForsightaFieldsService: ConsultingFieldsService,
    private _translateion:TranslationService,
    private _isicService: IndustryService // Add this line
  ) {
    this.isLoadingConsultingFields$ = this._ForsightaFieldsService.isLoading$
    this.lang=this._translateion.getSelectedLanguage();
    this.isLoadingISIC$ = this._isicService.isLoading$
  }

  ngOnInit() {
    this.windowResize()
    this.setOptionLabel()
    this.getConsultingFieldsList();
    this.loadISIC();
    this.initForm();
    this.updateParentModel({}, this.checkForm());
    this._translateion.onLanguageChange().subscribe((lang)=>{
      this.lang =lang;
      this.setOptionLabel();
      this.loadISIC();
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
  loadISIC() {
    this.reverseLoader=true;
    const isicSub = this._isicService.getIsicCodesTree().subscribe({
      next: (res) => {
        this.nodes = res;
        this.selectDefaultNodes();
      },
      error: (err) => {
        console.error('Error fetching ISIC codes:', err);
      },
    });
    this.unsubscribe.push(isicSub);
  }
  selectDefaultNodes() {
    this.reverseLoader=true;
    this.selectedNodes = [];
    const codesToSelect = this.defaultValues.isicCodes.map((node: any) => node.data.key);
  
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
  
    traverse(this.nodes);
    this.reverseLoader=false;
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
      this.form.controls.phoneNumber.setValue(sanitizedValue, { emitEvent: false });
  }
  windowResize(){
    const screenwidth$ = fromEvent(window,'resize').pipe(
      map(()=>window.innerWidth),
      startWith(window.innerWidth)
    );

    this.resizeSubscription = screenwidth$.subscribe((width)=>{
      this.dialogWidth = width <768 ? '100vw' : '70vw';
      console.log(this.dialogWidth);
    })
  }
  showISICDialog() {
    this.isISICDialogVisible = true;
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



  onISICDialogOK() {
    this.isISICDialogVisible = false;
    // Update the form control 'isicCodes' with selected nodes
    const selectedIsicCodes = this.selectedNodes.map((node: any) => node);
    this.form.get('isicCodes')?.setValue(selectedIsicCodes);
    this.form.get('isicCodes')?.markAsTouched();
    this.updateParentModel({ isicCodes: selectedIsicCodes }, this.checkForm());
    console.log("this.selectedNodoes on Dialog", this.selectedNodes);
  }
  
  onISICDialogCancel() {
    this.isISICDialogVisible = false;
  }
  selectedNodesLabel(): string {
    if (this.selectedNodes && this.selectedNodes.length > 0) {
      return this.selectedNodes.map((node: any) => node.label).join(', ');
    } else {
      return '';
    }
  }  
  getConsultingFieldsList() {
    const listSub = this._ForsightaFieldsService.getConsultingFields().subscribe({
      next: (data: ConsultingField[]) => {
        this.listOfConsultingFields = data;
      },
      error: (error) => {
        this.messages = [];
        if (error.validationMessages) {
          this.messages = error.validationMessages;
        } else {
          this.messages.push({
            severity: 'error',
            summary: 'Error',
            detail: 'An unexpected error occurred.',
          });
          setTimeout(() => {
            this.messages = [];
          }, 4000);
        }
      },
    });
    this.unsubscribe.push(listSub);
  }

  
  setOptionLabel() {
    // Adjust the optionLabel based on the current language
    if (this.lang === 'en') {
      this.optionLabel = 'names.en';
    } else if (this.lang === 'ar') {
      this.optionLabel = 'names.ar';
    }
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
          aboutCompany: [this.defaultValues.aboutCompany || '', [Validators.required]],
          phoneCountryCode: [this.defaultValues.phoneCountryCode || ''],
          phoneNumber: [
            this.defaultValues.phoneNumber || '',
            [
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
