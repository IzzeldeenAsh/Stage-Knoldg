import { Component, OnInit, OnDestroy, ViewChild, signal } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subscription, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ConfirmPasswordValidator } from './confirm-password.validator';
import { Signal , computed, effect } from '@angular/core';

import { first } from 'rxjs/operators';
import countriesData from 'src/app/_metronic/shared/countires.json';
import { CountryService } from 'src/app/_fake/services/countries-api/countries-get.service';
import { Country } from 'src/app/_fake/models/country.model';
import { TranslationService } from 'src/app/modules/i18n';
import { ConsultingFieldService } from 'src/app/_fake/services/consulting-field/consulting-field.service';
import { IsicService } from 'src/app/_fake/services/isic/isic.service';
import { HSCodeService } from 'src/app/_fake/services/hs-code/hs-code.service';
import { Dropdown } from 'primeng/dropdown';
import { UserPreRegistration } from 'src/app/_fake/models/pre-user.model';
import { PreRegsiterService } from 'src/app/_fake/services/pre-register/pre-regsiter.service';

import { ScrollAnimsService } from 'src/app/_fake/services/scroll-anims/scroll-anims.service';
import { Message } from 'primeng/api';
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

  // isLoading = signal(false);
  // isLoadingSubmit = signal(false);
  // isLoadingCountries = signal(false);
  // isLoadingIsicCodes = signal(false);
  // isLoadingHSCodes = signal(false);
  // isLoadingConsultingFields = signal(false);

  messages: Message[] = [];  // Array to hold error messages
  passwordFieldType: string = 'password';
  confirmPasswordFieldType: string = 'password';
  registrationForm: FormGroup;
  hasError: boolean;

  consultingFields: any[] = []; 
  isic:any;
  isicCodes: any[] = [];

  hsCodes: any[] = [];
  optionLabelHSCode:string;
  lang:string;
  isOtherSelected: boolean = false; // Track if "Other" is selected
  private unsubscribe: Subscription[] = [];
  optionLabelField: string = 'description.en';  // default to English
  optionLabel: string = 'name.en';  // default to English
  countries: Country[];
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private _countriesGet :CountryService,
    private _translateion:TranslationService,
    private _consultingFieldsService: ConsultingFieldService, // Add your service
    private _isicService: IsicService, // Inject the ISIC service
    private _hsCodeService: HSCodeService, // Inject the HSCodeService
    private _register: PreRegsiterService ,// Inject the HSCodeService
    private scrollAnims: ScrollAnimsService
  ) {
    this.isLoading$ = this.authService.isLoading$;
    this.isLoadingCountires$ = this._countriesGet.isLoading$;
    this.isLoadingIsicCodes$ = this._isicService.isLoading$;
    this.isLoadingConsultingFields$ = this._consultingFieldsService.isLoading$
    this.isLoadingHSCodes$ = this._hsCodeService.isLoading$;
    this.isLoadingSubmit$ = this._register.isLoading$;
  }
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.scrollAnims.scrollAnimations();
    }, 100); // Delay to ensure DOM elements are fully loaded
  }

  ngOnInit(): void {
   
    this._translateion.onLanguageChange().subscribe((lang)=>{
      this.lang =lang;
      this.setOptionLabel()
    })
    // this.countries = countriesData.countriesLocalAPI;
    this.getListOfCountries();
    this.setOptionLabel()
    this.initForm();
    this.getConsultingFields();
    this.getIsicCodes();
     // Initial fetch of HS codes
    this.onConsultingFieldChange();
    this.onISICFieldChange()
  }
  getIsicCodes() {
    const getIsicCodesSub = this._isicService.getIsicCodes(this.lang).subscribe({
      next: (res) => {
        this.isicCodes = res;
      },
      error: (err) => {
       
      },
    });
    this.unsubscribe.push(getIsicCodesSub);
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
  trimText(text: string, maxLength: number): string {
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  }
  setOptionLabelFiield() {
    // Adjust the optionLabel based on the current language
    if (this.lang === 'en') {
      this.optionLabelField = 'description.en';
      this.optionLabelHSCode = 'label'; // Using the 'label' property set in getHSCodes()
    } else if (this.lang === 'ar') {
      this.optionLabelField = 'description.ar';
      this.optionLabelHSCode = 'label'; // Using the 'label' property set in getHSCodes()
    }
  }
  
  getListOfCountries(){
    const getCountriesSub = this._countriesGet.getCountries().subscribe({
      next : (res)=>{
        this.countries=res
      },
      error : (err)=>{console.log('err',err)}
    })
    this.unsubscribe.push(getCountriesSub)
  }


  setOptionLabel() {
    // Adjust the optionLabel based on the current language
    if (this.lang === 'en') {
      this.optionLabel = 'name.en';
    } else if (this.lang === 'ar') {
      this.optionLabel = 'name.ar';
    }
  }

  // Form initialization
  initForm() {
    this.registrationForm = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
        lastName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
        aboutDescription: [''],
        email: ['', [Validators.required, Validators.email, Validators.minLength(3), Validators.maxLength(320)]],
        password: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
        country: [null, Validators.required],
        consultingField: [null, Validators.required], // Consulting Field
        otherConsultingField: ['', Validators.maxLength(100)], // Optional field for "Other"
        industry: [null, Validators.required], // Updated to [null]
        hscode: [null], // Updated to [null] for dropdown
        cPassword: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
        agree: [true],
      },
      {
        validator: ConfirmPasswordValidator.MatchPassword,
      }
    );
  }

  // When the user changes the Consulting Field
  onConsultingFieldChange() {
    const consultingFieldSub= this.registrationForm.get('consultingField')?.valueChanges.subscribe(res=>{
     if(res && res.id ===6){
      this.isOtherSelected = true;
      if (!this.isOtherSelected) {
        this.registrationForm.controls['otherConsultingField'].reset();
      }
     }
    })
  if(consultingFieldSub)  this.unsubscribe.push(consultingFieldSub)
  }

  onISICFieldChange() {
    const ISICFieldSub= this.registrationForm.get('industry')?.valueChanges.subscribe(res=>{
      if(res){
        this.getHScodeByISIC(res.code)
      }else{
        this.hsCodes=[];
        this.registrationForm.get('hscode')?.setValue(null)
      }
     
    })
  if(ISICFieldSub)  this.unsubscribe.push(ISICFieldSub)
  }

  getHScodeByISIC(ISICid:string){
    const getHScodeSub = this._hsCodeService.getHScodeByISIC(this.lang,ISICid).subscribe(
      {
        next: (res) => {
          this.hsCodes = res.map((item:any) => {
            // Set the label for the dropdown based on the current language
            let label = '';
            if (this.lang === 'en') {
              label = item.section.en;
            } else if (this.lang === 'ar') {
              label = item.section.ar || item.section.en; // Fallback to English if Arabic is not available
            }
            return {
              ...item,
              label: label,
            };
          });
        },
        error: (err) => {
          console.log('Error fetching HS codes:', err);
        },
      }
    );
    if(getHScodeSub)  this.unsubscribe.push(getHScodeSub)
  }

  submit() {
    if(this.registrationForm.valid){
      this.hasError = false;
      const newUser:UserPreRegistration={
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirm_password: '',
        country_id: 1,
        isic_code: '',
        consulting_feild_id: 7,
        hs_code: '',
        description: ''
      };
      newUser.first_name=this.registrationForm.get('firstName')?.value;
      newUser.last_name=this.registrationForm.get('lastName')?.value;
      newUser.email=this.registrationForm.get('email')?.value;
      newUser.password=this.registrationForm.get('password')?.value;
      newUser.confirm_password=this.registrationForm.get('password')?.value;
      newUser.country_id=this.registrationForm.get('country')?.value.id;
      newUser.isic_code=this.registrationForm.get('industry')?.value.id;
      newUser.consulting_feild_id =this.registrationForm.get('consultingField')?.value.id;
      newUser.hs_code=this.registrationForm.get('hscode')?.value?this.registrationForm.get('hscode')?.value.id  : null ;
      newUser.description =this.registrationForm.get('aboutDescription')?.value ? this.registrationForm.get('aboutDescription')?.value : null;
      newUser.other_consulting_field=this.registrationForm.get('otherConsultingField')?.value ? this.registrationForm.get('otherConsultingField')?.value : null;
      console.log('newUser',newUser);

      const registerAPI= this._register.preRegisterUser(newUser).pipe(first()).subscribe({
        next: (res)=>{
          console.log('res',res)
          if(res.state){
           this.registrationForm.reset();
           this.router.navigate(['/auth/verify-email' , newUser.email])
          }
        },
        error: (error) => {
          // Clear the existing messages
          this.messages = [];
        
          // Check if the error contains validation messages
          if (error.validationMessages) {
            this.messages = error.validationMessages;  // Set the messages array
          } else {
            this.messages.push({ severity: 'error', summary: 'Error', detail: 'An unexpected error occurred.' });
          }
        }
      
      })
      this.unsubscribe.push(registerAPI);
    }else{
      this.hasError = true;
    }

  }
  togglePasswordVisibility(field: string): void {
    if (field === 'password') {
      this.passwordFieldType =
        this.passwordFieldType === 'password' ? 'text' : 'password';
    } else if (field === 'confirmPassword') {
      this.confirmPasswordFieldType =
        this.confirmPasswordFieldType === 'password' ? 'text' : 'password';
    }
  }
  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}