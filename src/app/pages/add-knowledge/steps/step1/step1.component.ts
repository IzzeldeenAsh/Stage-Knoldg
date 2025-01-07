import { Component, Injector, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ICreateKnowldege } from '../../create-account.helper';
import { TranslationService } from 'src/app/modules/i18n/translation.service';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-step1',
  templateUrl: './step1.component.html',
})
export class Step1Component extends BaseComponent implements OnInit {
  @Input('updateParentModel') updateParentModel: (
    part: Partial<ICreateKnowldege>,
    isFormValid: boolean
  ) => void;
  form: FormGroup;
  @Input() defaultValues: Partial<ICreateKnowldege>;

  knowledgeTypes = [
    {
      id: 'kt_create_account_form_type_data',
      value: 'data',
      label: 'DATA',
      iconName: 'data',
      iconClass: 'text-primary',
      icon: 'fas fa-database text-primary mx-2 fs-6',
      description: 'DATA_DESCRIPTION'
    },
    {
      id: 'kt_create_account_form_type_insights',
      value: 'insight',
      label: 'INSIGHTS',
      iconName: 'chart-line',
      iconClass: 'text-success',
      icon: 'fas fa-lightbulb text-success mx-2 fs-6',
      description: 'INSIGHTS_DESCRIPTION'
    },
    {
      id: 'kt_create_account_form_type_reports',
      value: 'reports',
      label: 'REPORTS',
      iconName: 'document',
      iconClass: 'text-info',
      icon: 'fas fa-file-alt text-info mx-2 fs-6',
      description: 'REPORTS_DESCRIPTION'
    },
    {
      id: 'kt_create_account_form_type_manual',
      value: 'manual',
      label: 'MANUAL',
      iconName: 'book',
      iconClass: 'text-warning',
      icon: 'fas fa-book text-warning mx-2 fs-6',
      description: 'MANUAL_DESCRIPTION'
    }
  ];

  constructor(injector: Injector,private fb: FormBuilder, private translationService: TranslationService) {
    super(injector);
  }

  ngOnInit() {
    this.initForm();
    this.updateParentModel({}, this.checkForm());

    const langChangeSub = this.translationService.onLanguageChange().subscribe(lang => {
      // Perform any actions needed when the language changes
      // For example, you can update form labels or placeholders if they are managed in TypeScript
    });
    this.unsubscribe.push(langChangeSub);
  }

  initForm() {
    this.form = this.fb.group({
      knowledgeType: [this.defaultValues.knowledgeType, [Validators.required]],
    });

    const formChangesSubscr = this.form.valueChanges.subscribe((val) => {
      this.updateParentModel(val, this.checkForm());
    });
    this.unsubscribe.push(formChangesSubscr);
  }

  checkForm(): boolean {
    return this.form.valid;
  }

}
