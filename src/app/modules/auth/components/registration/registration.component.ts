import { UpgradePlanModalComponent } from './../../../../_metronic/partials/layout/modals/upgrade-plan-modal/upgrade-plan-modal.component';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subscription, Observable, fromEvent } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ConfirmPasswordValidator } from './confirm-password.validator';
import { first, map, startWith } from 'rxjs/operators';
import { CountryService } from 'src/app/_fake/services/countries-api/countries-get.service';
import { ICountry } from 'src/app/_fake/models/country.model';
import { TranslationService } from 'src/app/modules/i18n';
import { ConsultingFieldService } from 'src/app/_fake/services/consulting-field/consulting-field.service';
import { HSCodeService } from 'src/app/_fake/services/hs-code/hs-code.service';
import { UserPreRegistration } from 'src/app/_fake/models/pre-user.model';
import { PreRegsiterService } from 'src/app/_fake/services/pre-register/pre-regsiter.service';
import { ScrollAnimsService } from 'src/app/_fake/services/scroll-anims/scroll-anims.service';
import { Message, TreeNode } from 'primeng/api';
import { IsicService } from 'src/app/_fake/services/isic/isic.service';

@Component({
  selector: 'app-registration',
  templateUrl: './preregistraion.component.html',
  styleUrls: ['./registration.component.scss'],
})
export class RegistrationComponent implements OnInit, OnDestroy {
  isLoading$: Observable<boolean>;
  isLoadingConsultingFields$: Observable<boolean>;
  isLoadingSubmit$: Observable<boolean>;
  isLoadingIsicCodes$: Observable<boolean>;
  isLoadingCountires$: Observable<boolean>;
  isLoadingHSCodes$: Observable<boolean>;
  dialogWidth: string = '50vw';

  selectedNodes: any;
  selectedCountry: any;
  isISICDialogVisible: boolean = false;

  messages: Message[] = [];
  passwordFieldType: string = 'password';
  confirmPasswordFieldType: string = 'password';
  registrationForm: FormGroup;
  hasError: boolean = false;

  consultingFields: any[] = [];
  isic: any;
  isicCodes: any[] = [];
  nodes: TreeNode[] = []; // Corrected type
  hsCodes: any[] = [];
  optionLabelHSCode: string;
  lang: string;
  isOtherSelected: boolean = false;
  private unsubscribe: Subscription[] = [];
  optionLabelField: string = 'description.en';
  optionLabel: string = 'name.en';
  countries: ICountry[];

  resizeSubscription!: Subscription;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private _countriesGet: CountryService,
    public translate: TranslationService,
    private _consultingFieldsService: ConsultingFieldService,
    private _isicService: IsicService,
    private _hsCodeService: HSCodeService,
    private _register: PreRegsiterService,
    private scrollAnims: ScrollAnimsService
  ) {
    this.isLoading$ = this.authService.isLoading$;
    this.isLoadingCountires$ = this._countriesGet.isLoading$;
    this.isLoadingIsicCodes$ = this._isicService.isLoading$;
    this.isLoadingConsultingFields$ = this._consultingFieldsService.isLoading$;
    this.isLoadingHSCodes$ = this._hsCodeService.isLoading$;
    this.isLoadingSubmit$ = this._register.isLoading$;
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.scrollAnims.scrollAnimations();
    }, 100);
  }


  ngOnInit(): void {

    //  window.addEventListener('resize', this.updateDialogWidth.bind(this));
    this.translate.onLanguageChange().subscribe((lang) => {
      this.lang = lang;
      this.selectedNodes= null;
      this.loadISIC();
      this.setOptionLabel();
      this.setOptionLabelField()
    });
    this.getListOfCountries();
    this.setOptionLabel();
    this.initForm();
    this.getConsultingFields();
    this.onConsultingFieldChange();
    this.loadISIC();
    this.windowResize()
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


  loadISIC() {
    this._isicService.getIsicCodes().pipe(first()).subscribe({
      next: (res) => {
        console.log('ISIC DATA', res);
        this.nodes = this.buildTreeNodes(res);
      },
      error: (err) => {
        console.error('Error fetching ISIC codes:', err);
      },
    });
  }

  buildTreeNodes(data: any[]): TreeNode[] {
    return data.map((item) => this.transformToTreeNode(item));
  }

  transformToTreeNode(item: any): TreeNode {
    let label = item.name ? (this.lang === 'en' ? item.name.en : item.name.ar) : '';
    let node: TreeNode = {
      label: `${item.code} ${label}`,
      data: item,
      key: item.code,
      children: item.child_isic_code ? item.child_isic_code.map((child: any) => this.transformToTreeNode(child)) : [],
    };
    return node;
  }

  showISICDialog() {
    this.isISICDialogVisible = true;
  }

  onISICDialogOK() {
    this.isISICDialogVisible = false;
    // Any additional processing if needed
  }

  onISICDialogCancel() {
    this.isISICDialogVisible = false;
  }

  selectedNodesLabel(): string {
    if (this.selectedNodes && this.selectedNodes.length > 0) {
      return this.selectedNodes.map((node:any) => node.label).join(', ');
    } else {
      return '';
    }
  }

  getConsultingFields() {
    const getConsultingFieldsSub = this._consultingFieldsService.getConsultingFields().subscribe({
      next: (res) => {
        this.consultingFields = res;
      },
      error: (err) => {
        console.log('err', err);
      },
    });
    this.unsubscribe.push(getConsultingFieldsSub);
  }

  setOptionLabelField() {
    if (this.lang === 'en') {
      this.optionLabelField = 'description.en';
      this.optionLabelHSCode = 'label';
    } else if (this.lang === 'ar') {
      this.optionLabelField = 'description.ar';
      this.optionLabelHSCode = 'label';
    }
  }

  getListOfCountries() {
    const getCountriesSub = this._countriesGet.getCountries().subscribe({
      next: (res) => {
        this.countries = res.map((country: ICountry) => ({
          ...country,
          flagPath: `../../../../../assets/media/flags/${country.flag}.svg`,
        }));
      },
      error: (err) => {
        console.log('err', err);
      },
    });
    this.unsubscribe.push(getCountriesSub);
  }

  setOptionLabel() {
    if (this.lang === 'en') {
      this.optionLabel = 'name.en';
    } else if (this.lang === 'ar') {
      this.optionLabel = 'name.ar';
    }
  }

  initForm() {
    this.registrationForm = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
        lastName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
        aboutDescription: [''],
        email: ['', [Validators.required, Validators.email, Validators.minLength(3), Validators.maxLength(320)]],
        password: [
          '',
          [
            Validators.required,
            Validators.minLength(8),
            Validators.maxLength(100),
            Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
          ],
        ],
        consultingField: [[], Validators.required],
        otherConsultingField: ['', Validators.maxLength(100)],
        agree: [true],
      },
      {
        validator: ConfirmPasswordValidator.MatchPassword,
      }
    );
  }

  onConsultingFieldChange() {
    const consultingFieldSub = this.registrationForm
      .get('consultingField')
      ?.valueChanges.subscribe((res) => {
        const selectedFields = res;
        if (selectedFields && selectedFields.length > 0) {
          this.isOtherSelected = selectedFields.some((field: any) => field.description.en.trim() === 'Other');
        } else {
          this.isOtherSelected = false;
        }

        if (this.isOtherSelected) {
          this.registrationForm
            .get('otherConsultingField')
            ?.setValidators([Validators.required, Validators.maxLength(100)]);
        } else {
          this.registrationForm.get('otherConsultingField')?.clearValidators();
          this.registrationForm.get('otherConsultingField')?.setValue('');
        }
        this.registrationForm.get('otherConsultingField')?.updateValueAndValidity();
      });
    if (consultingFieldSub) this.unsubscribe.push(consultingFieldSub);
  }

  submit() {
    if (this.registrationForm.valid && this.selectedNodes.length > 0 && this.selectedCountry) {
      this.hasError = false;
      const newUser: UserPreRegistration = {
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirm_password: '',
        country_id: 1,
        isic_codes: [],
        consulting_feild_ids: [],
        hs_code: '',
        description: '',
      };
      newUser.first_name = this.registrationForm.get('firstName')?.value;
      newUser.last_name = this.registrationForm.get('lastName')?.value;
      newUser.email = this.registrationForm.get('email')?.value;
      newUser.password = this.registrationForm.get('password')?.value;
      newUser.confirm_password = this.registrationForm.get('password')?.value;
      newUser.country_id = this.selectedCountry.id;
      newUser.isic_codes = this.selectedNodes.map((node:any) => node.data.id);
      newUser.consulting_feild_ids = this.registrationForm
        .get('consultingField')
        ?.value.map((field: any) => field.id);
      newUser.description = this.registrationForm.get('aboutDescription')?.value || null;
      newUser.other_consulting_field = this.registrationForm.get('otherConsultingField')?.value || null;
      console.log("newUser",newUser);
      const registerAPI = this._register.preRegisterUser(newUser).pipe(first()).subscribe({
        next: (res) => {
          if (res.state) {
            this.registrationForm.reset();
            this.router.navigate(['/auth/verify-email', newUser.email]);
          }
        },
        error: (error) => {
          this.messages = [];
          if (error.validationMessages) {
            this.messages = error.validationMessages;
          } else {
            this.messages.push({ severity: 'error', summary: 'Error', detail: 'An unexpected error occurred.' });
          }
        },
      });
      this.unsubscribe.push(registerAPI);
    } else {
      this.hasError = true;
    }
  }

  togglePasswordVisibility(field: string): void {
    if (field === 'password') {
      this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
    } else if (field === 'confirmPassword') {
      this.confirmPasswordFieldType = this.confirmPasswordFieldType === 'password' ? 'text' : 'password';
    }
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
