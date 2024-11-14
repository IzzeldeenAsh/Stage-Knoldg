import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { ICreateAccount } from '../../create-account.helper';
import { ConsultingField, ConsultingFieldsService } from 'src/app/_fake/services/admin-consulting-fields/consulting-fields.service';
import { Message } from 'primeng/api';
import { TranslationService } from 'src/app/modules/i18n';

@Component({
  selector: 'app-step2',
  templateUrl: './step2.component.html',
})
export class Step2Component implements OnInit, OnDestroy {
  isLoadingConsultingFields$: Observable<boolean>;
  listOfConsultingFields: ConsultingField[] = [];
  messages: Message[] = [];
  optionLabel: string = 'name.en';
  lang:string;
  @Input('updateParentModel') updateParentModel: (
    part: Partial<ICreateAccount>,
    isFormValid: boolean
  ) => void;
  form: FormGroup;
  @Input() defaultValues: Partial<ICreateAccount>;

  private unsubscribe: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private _ForsightaFieldsService: ConsultingFieldsService,
    private _translateion:TranslationService,
  ) {
    this.isLoadingConsultingFields$ = this._ForsightaFieldsService.isLoading$
    this.lang=this._translateion.getSelectedLanguage()
  }

  ngOnInit() {
    this.setOptionLabel()
    this.getConsultingFieldsList();
    this.initForm();
    this.updateParentModel({}, this.checkForm());
    this._translateion.onLanguageChange().subscribe((lang)=>{
      this.lang =lang;
      this.setOptionLabel()
    })
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
        phone: [this.defaultValues.phone || '', [Validators.required]],
        consultingFields: [this.defaultValues.consultingFields || [], [Validators.required]],
        isicCodes: [this.defaultValues.isicCodes || [], [Validators.required]],
      });
    } else {
      this.form = this.fb.group(
        {
          legalName: [this.defaultValues.legalName || '', [Validators.required]],
          website: [this.defaultValues.website || ''],
          registerDocument: [this.defaultValues.registerDocument || null],
          aboutCompany: [this.defaultValues.aboutCompany || '', [Validators.required]],
          phone: [this.defaultValues.phone || '', [Validators.required]],
          consultingFields: [this.defaultValues.consultingFields || [], [Validators.required]],
          isicCodes: [this.defaultValues.isicCodes || [], [Validators.required]],
        },
        { validators: this.atLeastOneRequired('website', 'registerDocument') }
      );
    }

    

    const formChangesSubscr = this.form.valueChanges.subscribe((val) => {
      this.updateParentModel(val, this.checkForm());
    });
    this.unsubscribe.push(formChangesSubscr);
  }

  atLeastOneRequired(...fields: string[]) {
    return (group: FormGroup) => {
      const hasAtLeastOne = fields.some((fieldName) => {
        const field = group.get(fieldName);
        return field && field.value && field.value !== '';
      });
      return hasAtLeastOne ? null : { atLeastOneRequired: true };
    };
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

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
