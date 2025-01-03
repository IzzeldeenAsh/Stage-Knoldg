import { Component, Injector, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ICreateKnowldege } from '../../create-account.helper';
import { BaseComponent } from 'src/app/modules/base.component';
import { LanguagesService, Language } from 'src/app/_fake/services/languages-list/languages.service';
import { TranslationService } from 'src/app/modules/i18n/translation.service';

@Component({
  selector: 'app-step2',
  templateUrl: './step2.component.html',
})
export class Step2Component extends BaseComponent implements OnInit {
  @Input('updateParentModel') updateParentModel: (
    part: Partial<ICreateKnowldege>,
    isFormValid: boolean
  ) => void;
  form: FormGroup;
  @Input() defaultValues: Partial<ICreateKnowldege>;
  languages: Language[] = [];
  currentLang: string = 'en';

  constructor(
    injector: Injector,
    private fb: FormBuilder,
    private languagesService: LanguagesService,
    private translationService: TranslationService
  ) {
    super(injector);
    this.currentLang = this.translationService.getSelectedLanguage();
  }

  ngOnInit() {
    this.initForm();
    this.loadLanguages();
    this.updateParentModel({}, this.checkForm());

    // Subscribe to language changes
    const langChangeSub = this.translationService.onLanguageChange().subscribe(lang => {
      if (lang) {
        this.currentLang = lang;
        this.loadLanguages();
      }
    });
    this.unsubscribe.push(langChangeSub);
  }

  private loadLanguages() {
    const languagesSub = this.languagesService.getLanguages(this.currentLang).subscribe({
      next: (languages) => {
        this.languages = languages;
      },
      error: (error) => {
        console.error('Error loading languages:', error);
      }
    });
    this.unsubscribe.push(languagesSub);
  }

  initForm() {
    this.form = this.fb.group({
      title: [this.defaultValues.title, [Validators.required]],
      description: [this.defaultValues.description, [Validators.required]],
      accountPlan: [this.defaultValues.accountPlan, [Validators.required]],
      language: [this.defaultValues.language, [Validators.required]],
    });

    const formChangesSubscr = this.form.valueChanges.subscribe((val) => {
      this.updateParentModel(val, this.checkForm());
    });
    this.unsubscribe.push(formChangesSubscr);
  }

  checkForm() {
    return !this.form.get('title')?.hasError('required');
  }
}
