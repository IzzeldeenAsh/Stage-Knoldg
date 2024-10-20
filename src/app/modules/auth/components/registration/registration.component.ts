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
    this.isicCodes=[
      {
          "id": 1,
          "code": "0142",
          "level": null,
          "description": {
              "en": "Raising of horses and other equines"
          },
          "is_active": 0
      },
      {
          "id": 2,
          "code": "0141",
          "level": null,
          "description": {
              "en": "Raising of cattle and buffaloes"
          },
          "is_active": 0
      },
      {
          "id": 3,
          "code": "0145",
          "level": null,
          "description": {
              "en": "Raising of swine/pigs"
          },
          "is_active": 0
      },
      {
          "id": 4,
          "code": "0144",
          "level": null,
          "description": {
              "en": "Raising of sheep and goats"
          },
          "is_active": 0
      },
      {
          "id": 5,
          "code": "0146",
          "level": null,
          "description": {
              "en": "Raising of poultry"
          },
          "is_active": 0
      },
      {
          "id": 6,
          "code": "0149",
          "level": null,
          "description": {
              "en": "Raising of other animals"
          },
          "is_active": 0
      },
      {
          "id": 7,
          "code": "014",
          "level": null,
          "description": {
              "en": "Animal production"
          },
          "is_active": 0
      },
      {
          "id": 8,
          "code": "032",
          "level": null,
          "description": {
              "en": "Aquaculture"
          },
          "is_active": 0
      },
      {
          "id": 9,
          "code": "1010",
          "level": null,
          "description": {
              "en": "Processing and preserving of meat"
          },
          "is_active": 0
      },
      {
          "id": 10,
          "code": "03",
          "level": null,
          "description": {
              "en": "Fishing and aquaculture"
          },
          "is_active": 0
      },
      {
          "id": 11,
          "code": "1020",
          "level": null,
          "description": {
              "en": "Processing and preserving of fish, crustaceans and molluscs"
          },
          "is_active": 0
      },
      {
          "id": 12,
          "code": "0311",
          "level": null,
          "description": {
              "en": "Marine fishing"
          },
          "is_active": 0
      },
      {
          "id": 13,
          "code": "1050",
          "level": null,
          "description": {
              "en": "Manufacture of dairy products"
          },
          "is_active": 0
      },
      {
          "id": 14,
          "code": "1079",
          "level": null,
          "description": {
              "en": "Manufacture of other food products n.e.c."
          },
          "is_active": 0
      },
      {
          "id": 15,
          "code": "9602",
          "level": null,
          "description": {
              "en": "Hairdressing and other beauty treatment"
          },
          "is_active": 0
      },
      {
          "id": 16,
          "code": "0113",
          "level": null,
          "description": {
              "en": "Growing of vegetables and melons, roots and tubers"
          },
          "is_active": 0
      },
      {
          "id": 17,
          "code": "0130",
          "level": null,
          "description": {
              "en": "Plant propagation"
          },
          "is_active": 0
      },
      {
          "id": 18,
          "code": "0119",
          "level": null,
          "description": {
              "en": "Growing of other non-perennial crops"
          },
          "is_active": 0
      },
      {
          "id": 19,
          "code": "0230",
          "level": null,
          "description": {
              "en": "Gathering of non-wood forest products"
          },
          "is_active": 0
      },
      {
          "id": 20,
          "code": "0111",
          "level": null,
          "description": {
              "en": "Growing of cereals (except rice), leguminous crops and oil seeds"
          },
          "is_active": 0
      },
      {
          "id": 21,
          "code": "0128",
          "level": null,
          "description": {
              "en": "Growing of spices, aromatic, drug and pharmaceutical crops"
          },
          "is_active": 0
      },
      {
          "id": 22,
          "code": "01",
          "level": null,
          "description": {
              "en": "Crop and animal production, hunting and related service activities"
          },
          "is_active": 0
      },
      {
          "id": 23,
          "code": "1030",
          "level": null,
          "description": {
              "en": "Processing and preserving of fruit and vegetables"
          },
          "is_active": 0
      },
      {
          "id": 24,
          "code": "0126",
          "level": null,
          "description": {
              "en": "Growing of oleaginous fruits"
          },
          "is_active": 0
      },
      {
          "id": 25,
          "code": "0125",
          "level": null,
          "description": {
              "en": "Growing of other tree and bush fruits and nuts"
          },
          "is_active": 0
      },
      {
          "id": 26,
          "code": "0122",
          "level": null,
          "description": {
              "en": "Growing of tropical and subtropical fruits"
          },
          "is_active": 0
      },
      {
          "id": 27,
          "code": "0123",
          "level": null,
          "description": {
              "en": "Growing of citrus fruits"
          },
          "is_active": 0
      },
      {
          "id": 28,
          "code": "0121",
          "level": null,
          "description": {
              "en": "Growing of grapes"
          },
          "is_active": 0
      },
      {
          "id": 29,
          "code": "0124",
          "level": null,
          "description": {
              "en": "Growing of pome fruits and stone fruits"
          },
          "is_active": 0
      },
      {
          "id": 30,
          "code": "012",
          "level": null,
          "description": {
              "en": "Growing of perennial crops"
          },
          "is_active": 0
      },
      {
          "id": 31,
          "code": "0127",
          "level": null,
          "description": {
              "en": "Growing of beverage crops"
          },
          "is_active": 0
      },
      {
          "id": 32,
          "code": "0112",
          "level": null,
          "description": {
              "en": "Growing of rice"
          },
          "is_active": 0
      },
      {
          "id": 33,
          "code": "1061",
          "level": null,
          "description": {
              "en": "Manufacture of grain mill products"
          },
          "is_active": 0
      },
      {
          "id": 34,
          "code": "1103",
          "level": null,
          "description": {
              "en": "Manufacture of malt liquors and malt"
          },
          "is_active": 0
      },
      {
          "id": 35,
          "code": "1062",
          "level": null,
          "description": {
              "en": "Manufacture of starches and starch products"
          },
          "is_active": 0
      },
      {
          "id": 36,
          "code": "1040",
          "level": null,
          "description": {
              "en": "Manufacture of vegetable and animal oils and fats"
          },
          "is_active": 0
      },
      {
          "id": 37,
          "code": "1080",
          "level": null,
          "description": {
              "en": "Manufacture of prepared animal feeds"
          },
          "is_active": 0
      },
      {
          "id": 38,
          "code": "0129",
          "level": null,
          "description": {
              "en": "Growing of other perennial crops"
          },
          "is_active": 0
      },
      {
          "id": 39,
          "code": "2029",
          "level": null,
          "description": {
              "en": "Manufacture of other chemical products n.e.c."
          },
          "is_active": 0
      },
      {
          "id": 40,
          "code": "2023",
          "level": null,
          "description": {
              "en": "Manufacture of soap and detergents, cleaning and polishing preparations, perfumes and toilet preparations"
          },
          "is_active": 0
      },
      {
          "id": 41,
          "code": "1072",
          "level": null,
          "description": {
              "en": "Manufacture of sugar"
          },
          "is_active": 0
      },
      {
          "id": 42,
          "code": "1073",
          "level": null,
          "description": {
              "en": "Manufacture of cocoa, chocolate and sugar confectionery"
          },
          "is_active": 0
      },
      {
          "id": 43,
          "code": "1074",
          "level": null,
          "description": {
              "en": "Manufacture of macaroni, noodles, couscous and similar farinaceous products"
          },
          "is_active": 0
      },
      {
          "id": 44,
          "code": "1071",
          "level": null,
          "description": {
              "en": "Manufacture of bakery products"
          },
          "is_active": 0
      },
      {
          "id": 45,
          "code": "1104",
          "level": null,
          "description": {
              "en": "Manufacture of soft drinks; production of mineral waters and other bottled waters"
          },
          "is_active": 0
      },
      {
          "id": 46,
          "code": "1102",
          "level": null,
          "description": {
              "en": "Manufacture of wines"
          },
          "is_active": 0
      },
      {
          "id": 47,
          "code": "2011",
          "level": null,
          "description": {
              "en": "Manufacture of basic chemicals"
          },
          "is_active": 0
      },
      {
          "id": 48,
          "code": "1101",
          "level": null,
          "description": {
              "en": "Distilling, rectifying and blending of spirits"
          },
          "is_active": 0
      },
      {
          "id": 49,
          "code": "0115",
          "level": null,
          "description": {
              "en": "Growing of tobacco"
          },
          "is_active": 0
      },
      {
          "id": 50,
          "code": "1200",
          "level": null,
          "description": {
              "en": "Manufacture of tobacco products"
          },
          "is_active": 0
      },
      {
          "id": 51,
          "code": "0893",
          "level": null,
          "description": {
              "en": "Extraction of salt"
          },
          "is_active": 0
      },
      {
          "id": 52,
          "code": "0891",
          "level": null,
          "description": {
              "en": "Mining of chemical and fertilizer minerals"
          },
          "is_active": 0
      },
      {
          "id": 53,
          "code": "0899",
          "level": null,
          "description": {
              "en": "Other mining and quarrying n.e.c."
          },
          "is_active": 0
      },
      {
          "id": 54,
          "code": "0810",
          "level": null,
          "description": {
              "en": "Quarrying of stone, sand and clay"
          },
          "is_active": 0
      },
      {
          "id": 55,
          "code": "2399",
          "level": null,
          "description": {
              "en": "Manufacture of other non-metallic mineral products n.e.c."
          },
          "is_active": 0
      },
      {
          "id": 56,
          "code": "2394",
          "level": null,
          "description": {
              "en": "Manufacture of cement, lime and plaster"
          },
          "is_active": 0
      },
      {
          "id": 57,
          "code": "0710",
          "level": null,
          "description": {
              "en": "Mining of iron ores"
          },
          "is_active": 0
      },
      {
          "id": 58,
          "code": "0729",
          "level": null,
          "description": {
              "en": "Mining of other non-ferrous metal ores"
          },
          "is_active": 0
      },
      {
          "id": 59,
          "code": "0721",
          "level": null,
          "description": {
              "en": "Mining of uranium and thorium ores"
          },
          "is_active": 0
      },
      {
          "id": 60,
          "code": "2410",
          "level": null,
          "description": {
              "en": "Manufacture of basic iron and steel"
          },
          "is_active": 0
      },
      {
          "id": 61,
          "code": "2420",
          "level": null,
          "description": {
              "en": "Manufacture of basic precious and other non-ferrous metals"
          },
          "is_active": 0
      },
      {
          "id": 62,
          "code": "3821",
          "level": null,
          "description": {
              "en": "Treatment and disposal of non-hazardous waste"
          },
          "is_active": 0
      },
      {
          "id": 63,
          "code": "0510",
          "level": null,
          "description": {
              "en": "Mining of hard coal"
          },
          "is_active": 0
      },
      {
          "id": 64,
          "code": "1920",
          "level": null,
          "description": {
              "en": "Manufacture of refined petroleum products"
          },
          "is_active": 0
      },
      {
          "id": 65,
          "code": "0892",
          "level": null,
          "description": {
              "en": "Extraction of peat"
          },
          "is_active": 0
      },
      {
          "id": 66,
          "code": "1910",
          "level": null,
          "description": {
              "en": "Manufacture of coke oven products"
          },
          "is_active": 0
      },
      {
          "id": 67,
          "code": "3520",
          "level": null,
          "description": {
              "en": "Manufacture of gas; distribution of gaseous fuels through mains"
          },
          "is_active": 0
      },
      {
          "id": 68,
          "code": "0610",
          "level": null,
          "description": {
              "en": "Extraction of crude petroleum"
          },
          "is_active": 0
      },
      {
          "id": 69,
          "code": "0620",
          "level": null,
          "description": {
              "en": "Extraction of natural gas"
          },
          "is_active": 0
      },
      {
          "id": 70,
          "code": "3510",
          "level": null,
          "description": {
              "en": "Electric power generation, transmission and distribution"
          },
          "is_active": 0
      },
      {
          "id": 71,
          "code": "2012",
          "level": null,
          "description": {
              "en": "Manufacture of fertilizers and nitrogen compounds"
          },
          "is_active": 0
      },
      {
          "id": 72,
          "code": "2100",
          "level": null,
          "description": {
              "en": "Manufacture of pharmaceuticals, medicinal chemical and botanical products"
          },
          "is_active": 0
      },
      {
          "id": 73,
          "code": "3250",
          "level": null,
          "description": {
              "en": "Manufacture of medical and dental instruments and supplies"
          },
          "is_active": 0
      },
      {
          "id": 74,
          "code": "2220",
          "level": null,
          "description": {
              "en": "Manufacture of plastics products"
          },
          "is_active": 0
      },
      {
          "id": 75,
          "code": "2022",
          "level": null,
          "description": {
              "en": "Manufacture of paints, varnishes and similar coatings, printing ink and mastics"
          },
          "is_active": 0
      },
      {
          "id": 76,
          "code": "3290",
          "level": null,
          "description": {
              "en": "Other manufacturing n.e.c."
          },
          "is_active": 0
      },
      {
          "id": 77,
          "code": "7420",
          "level": null,
          "description": {
              "en": "Photographic activities"
          },
          "is_active": 0
      },
      {
          "id": 78,
          "code": "5911",
          "level": null,
          "description": {
              "en": "Motion picture, video and television programme production activities"
          },
          "is_active": 0
      },
      {
          "id": 79,
          "code": "1701",
          "level": null,
          "description": {
              "en": "Manufacture of pulp, paper and paperboard"
          },
          "is_active": 0
      },
      {
          "id": 80,
          "code": "2021",
          "level": null,
          "description": {
              "en": "Manufacture of pesticides and other agrochemical products"
          },
          "is_active": 0
      },
      {
          "id": 81,
          "code": "2391",
          "level": null,
          "description": {
              "en": "Manufacture of refractory products"
          },
          "is_active": 0
      },
      {
          "id": 82,
          "code": "2395",
          "level": null,
          "description": {
              "en": "Manufacture of articles of concrete, cement and plaster"
          },
          "is_active": 0
      },
      {
          "id": 83,
          "code": "3700",
          "level": null,
          "description": {
              "en": "Sewerage"
          },
          "is_active": 0
      },
      {
          "id": 84,
          "code": "3822",
          "level": null,
          "description": {
              "en": "Treatment and disposal of hazardous waste"
          },
          "is_active": 0
      },
      {
          "id": 85,
          "code": "2013",
          "level": null,
          "description": {
              "en": "Manufacture of plastics and synthetic rubber in primary forms"
          },
          "is_active": 0
      },
      {
          "id": 86,
          "code": "3830",
          "level": null,
          "description": {
              "en": "Materials recovery"
          },
          "is_active": 0
      },
      {
          "id": 87,
          "code": "2219",
          "level": null,
          "description": {
              "en": "Manufacture of other rubber products"
          },
          "is_active": 0
      },
      {
          "id": 88,
          "code": "2211",
          "level": null,
          "description": {
              "en": "Manufacture of rubber tyres and tubes; retreading and rebuilding of rubber tyres"
          },
          "is_active": 0
      },
      {
          "id": 89,
          "code": "1511",
          "level": null,
          "description": {
              "en": "Tanning and dressing of leather; dressing and dyeing of fur"
          },
          "is_active": 0
      },
      {
          "id": 90,
          "code": "1512",
          "level": null,
          "description": {
              "en": "Manufacture of luggage, handbags and the like, saddlery and harness"
          },
          "is_active": 0
      },
      {
          "id": 91,
          "code": "1410",
          "level": null,
          "description": {
              "en": "Manufacture of wearing apparel, except fur apparel"
          },
          "is_active": 0
      },
      {
          "id": 92,
          "code": "3230",
          "level": null,
          "description": {
              "en": "Manufacture of sports goods"
          },
          "is_active": 0
      },
      {
          "id": 93,
          "code": "1420",
          "level": null,
          "description": {
              "en": "Manufacture of articles of fur"
          },
          "is_active": 0
      },
      {
          "id": 94,
          "code": "0220",
          "level": null,
          "description": {
              "en": "Logging"
          },
          "is_active": 0
      },
      {
          "id": 95,
          "code": "1610",
          "level": null,
          "description": {
              "en": "Sawmilling and planing of wood"
          },
          "is_active": 0
      },
      {
          "id": 96,
          "code": "1621",
          "level": null,
          "description": {
              "en": "Manufacture of veneer sheets and wood-based panels"
          },
          "is_active": 0
      },
      {
          "id": 97,
          "code": "1629",
          "level": null,
          "description": {
              "en": "Manufacture of other products of wood; manufacture of articles of cork, straw and plaiting materials"
          },
          "is_active": 0
      },
      {
          "id": 98,
          "code": "1623",
          "level": null,
          "description": {
              "en": "Manufacture of wooden containers"
          },
          "is_active": 0
      },
      {
          "id": 99,
          "code": "1622",
          "level": null,
          "description": {
              "en": "Manufacture of builders' carpentry and joinery"
          },
          "is_active": 0
      },
      {
          "id": 100,
          "code": "170",
          "level": null,
          "description": {
              "en": "Manufacture of paper and paper products"
          },
          "is_active": 0
      },
      {
          "id": 101,
          "code": "1702",
          "level": null,
          "description": {
              "en": "Manufacture of corrugated paper and paperboard and of containers of paper and paperboard"
          },
          "is_active": 0
      },
      {
          "id": 102,
          "code": "1709",
          "level": null,
          "description": {
              "en": "Manufacture of other articles of paper and paperboard"
          },
          "is_active": 0
      },
      {
          "id": 103,
          "code": "5811",
          "level": null,
          "description": {
              "en": "Book publishing"
          },
          "is_active": 0
      },
      {
          "id": 104,
          "code": "5813",
          "level": null,
          "description": {
              "en": "Publishing of newspapers, journals and periodicals"
          },
          "is_active": 0
      },
      {
          "id": 105,
          "code": "5819",
          "level": null,
          "description": {
              "en": "Other publishing activities"
          },
          "is_active": 0
      },
      {
          "id": 106,
          "code": "7110",
          "level": null,
          "description": {
              "en": "Architectural and engineering activities and related technical consultancy"
          },
          "is_active": 0
      },
      {
          "id": 107,
          "code": "1811",
          "level": null,
          "description": {
              "en": "Printing"
          },
          "is_active": 0
      },
      {
          "id": 108,
          "code": "1311",
          "level": null,
          "description": {
              "en": "Preparation and spinning of textile fibres"
          },
          "is_active": 0
      },
      {
          "id": 109,
          "code": "131",
          "level": null,
          "description": {
              "en": "Spinning, weaving and finishing of textiles"
          },
          "is_active": 0
      },
      {
          "id": 110,
          "code": "1312",
          "level": null,
          "description": {
              "en": "Weaving of textiles"
          },
          "is_active": 0
      },
      {
          "id": 111,
          "code": "0116",
          "level": null,
          "description": {
              "en": "Growing of fibre crops"
          },
          "is_active": 0
      },
      {
          "id": 112,
          "code": "2030",
          "level": null,
          "description": {
              "en": "Manufacture of man-made fibres"
          },
          "is_active": 0
      },
      {
          "id": 113,
          "code": "1399",
          "level": null,
          "description": {
              "en": "Manufacture of other textiles n.e.c."
          },
          "is_active": 0
      },
      {
          "id": 114,
          "code": "1394",
          "level": null,
          "description": {
              "en": "Manufacture of cordage, rope, twine and netting"
          },
          "is_active": 0
      },
      {
          "id": 115,
          "code": "1393",
          "level": null,
          "description": {
              "en": "Manufacture of carpets and rugs"
          },
          "is_active": 0
      },
      {
          "id": 116,
          "code": "1392",
          "level": null,
          "description": {
              "en": "Manufacture of made-up textile articles, except apparel"
          },
          "is_active": 0
      },
      {
          "id": 117,
          "code": "1391",
          "level": null,
          "description": {
              "en": "Manufacture of knitted and crocheted fabrics"
          },
          "is_active": 0
      },
      {
          "id": 118,
          "code": "1430",
          "level": null,
          "description": {
              "en": "Manufacture of knitted and crocheted apparel"
          },
          "is_active": 0
      },
      {
          "id": 119,
          "code": "2750",
          "level": null,
          "description": {
              "en": "Manufacture of domestic appliances"
          },
          "is_active": 0
      },
      {
          "id": 120,
          "code": "1520",
          "level": null,
          "description": {
              "en": "Manufacture of footwear"
          },
          "is_active": 0
      },
      {
          "id": 121,
          "code": "2396",
          "level": null,
          "description": {
              "en": "Cutting, shaping and finishing of stone"
          },
          "is_active": 0
      },
      {
          "id": 122,
          "code": "2392",
          "level": null,
          "description": {
              "en": "Manufacture of clay building materials"
          },
          "is_active": 0
      },
      {
          "id": 123,
          "code": "2393",
          "level": null,
          "description": {
              "en": "Manufacture of other porcelain and ceramic products"
          },
          "is_active": 0
      },
      {
          "id": 124,
          "code": "2310",
          "level": null,
          "description": {
              "en": "Manufacture of glass and glass products"
          },
          "is_active": 0
      },
      {
          "id": 125,
          "code": "0321",
          "level": null,
          "description": {
              "en": "Marine aquaculture"
          },
          "is_active": 0
      },
      {
          "id": 126,
          "code": "3211",
          "level": null,
          "description": {
              "en": "Manufacture of jewellery and related articles"
          },
          "is_active": 0
      },
      {
          "id": 127,
          "code": "242",
          "level": null,
          "description": {
              "en": "Manufacture of other chemical products"
          },
          "is_active": 0
      },
      {
          "id": 128,
          "code": "3212",
          "level": null,
          "description": {
              "en": "Manufacture of imitation jewellery and related articles"
          },
          "is_active": 0
      },
      {
          "id": 129,
          "code": "241",
          "level": null,
          "description": {
              "en": "Manufacture of basic chemicals"
          },
          "is_active": 0
      },
      {
          "id": 130,
          "code": "2431",
          "level": null,
          "description": {
              "en": "Casting of iron and steel"
          },
          "is_active": 0
      },
      {
          "id": 131,
          "code": "2511",
          "level": null,
          "description": {
              "en": "Manufacture of structural metal products"
          },
          "is_active": 0
      },
      {
          "id": 132,
          "code": "2512",
          "level": null,
          "description": {
              "en": "Manufacture of tanks, reservoirs and containers of metal"
          },
          "is_active": 0
      },
      {
          "id": 133,
          "code": "2599",
          "level": null,
          "description": {
              "en": "Manufacture of other fabricated metal products n.e.c."
          },
          "is_active": 0
      },
      {
          "id": 134,
          "code": "2814",
          "level": null,
          "description": {
              "en": "Manufacture of bearings, gears, gearing and driving elements"
          },
          "is_active": 0
      },
      {
          "id": 135,
          "code": "2593",
          "level": null,
          "description": {
              "en": "Manufacture of cutlery, hand tools and general hardware"
          },
          "is_active": 0
      },
      {
          "id": 136,
          "code": "2513",
          "level": null,
          "description": {
              "en": "Manufacture of steam generators, except central heating hot water boilers"
          },
          "is_active": 0
      },
      {
          "id": 137,
          "code": "2829",
          "level": null,
          "description": {
              "en": "Manufacture of other special-purpose machinery"
          },
          "is_active": 0
      },
      {
          "id": 138,
          "code": "2819",
          "level": null,
          "description": {
              "en": "Manufacture of other general-purpose machinery"
          },
          "is_active": 0
      },
      {
          "id": 139,
          "code": "2811",
          "level": null,
          "description": {
              "en": "Manufacture of engines and turbines, except aircraft, vehicle and cycle engines"
          },
          "is_active": 0
      },
      {
          "id": 140,
          "code": "3030",
          "level": null,
          "description": {
              "en": "Manufacture of air and spacecraft and related machinery"
          },
          "is_active": 0
      },
      {
          "id": 141,
          "code": "2910",
          "level": null,
          "description": {
              "en": "Manufacture of motor vehicles"
          },
          "is_active": 0
      },
      {
          "id": 142,
          "code": "2930",
          "level": null,
          "description": {
              "en": "Manufacture of parts and accessories for motor vehicles"
          },
          "is_active": 0
      },
      {
          "id": 143,
          "code": "2812",
          "level": null,
          "description": {
              "en": "Manufacture of fluid power equipment"
          },
          "is_active": 0
      },
      {
          "id": 144,
          "code": "2813",
          "level": null,
          "description": {
              "en": "Manufacture of other pumps, compressors, taps and valves"
          },
          "is_active": 0
      },
      {
          "id": 145,
          "code": "2815",
          "level": null,
          "description": {
              "en": "Manufacture of ovens, furnaces and furnace burners"
          },
          "is_active": 0
      },
      {
          "id": 146,
          "code": "2825",
          "level": null,
          "description": {
              "en": "Manufacture of machinery for food, beverage and tobacco processing"
          },
          "is_active": 0
      },
      {
          "id": 147,
          "code": "2826",
          "level": null,
          "description": {
              "en": "Manufacture of machinery for textile, apparel and leather production"
          },
          "is_active": 0
      },
      {
          "id": 148,
          "code": "2816",
          "level": null,
          "description": {
              "en": "Manufacture of lifting and handling equipment"
          },
          "is_active": 0
      },
      {
          "id": 149,
          "code": "2824",
          "level": null,
          "description": {
              "en": "Manufacture of machinery for mining, quarrying and construction"
          },
          "is_active": 0
      },
      {
          "id": 150,
          "code": "2821",
          "level": null,
          "description": {
              "en": "Manufacture of agricultural and forestry machinery"
          },
          "is_active": 0
      },
      {
          "id": 151,
          "code": "282",
          "level": null,
          "description": {
              "en": "Manufacture of special-purpose machinery"
          },
          "is_active": 0
      },
      {
          "id": 152,
          "code": "1812",
          "level": null,
          "description": {
              "en": "Service activities related to printing"
          },
          "is_active": 0
      },
      {
          "id": 153,
          "code": "2817",
          "level": null,
          "description": {
              "en": "Manufacture of office machinery and equipment (except computers and peripheral equipment)"
          },
          "is_active": 0
      },
      {
          "id": 154,
          "code": "2620",
          "level": null,
          "description": {
              "en": "Manufacture of computers and peripheral equipment"
          },
          "is_active": 0
      },
      {
          "id": 155,
          "code": "2823",
          "level": null,
          "description": {
              "en": "Manufacture of machinery for metallurgy"
          },
          "is_active": 0
      },
      {
          "id": 156,
          "code": "2822",
          "level": null,
          "description": {
              "en": "Manufacture of metal-forming machinery and machine tools"
          },
          "is_active": 0
      },
      {
          "id": 157,
          "code": "2818",
          "level": null,
          "description": {
              "en": "Manufacture of power-driven hand tools"
          },
          "is_active": 0
      },
      {
          "id": 158,
          "code": "2710",
          "level": null,
          "description": {
              "en": "Manufacture of electric motors, generators, transformers and electricity distribution and control apparatus"
          },
          "is_active": 0
      },
      {
          "id": 159,
          "code": "2790",
          "level": null,
          "description": {
              "en": "Manufacture of other electrical equipment"
          },
          "is_active": 0
      },
      {
          "id": 160,
          "code": "2720",
          "level": null,
          "description": {
              "en": "Manufacture of batteries and accumulators"
          },
          "is_active": 0
      },
      {
          "id": 161,
          "code": "2740",
          "level": null,
          "description": {
              "en": "Manufacture of electric lighting equipment"
          },
          "is_active": 0
      },
      {
          "id": 162,
          "code": "2630",
          "level": null,
          "description": {
              "en": "Manufacture of communication equipment"
          },
          "is_active": 0
      },
      {
          "id": 163,
          "code": "2640",
          "level": null,
          "description": {
              "en": "Manufacture of consumer electronics"
          },
          "is_active": 0
      },
      {
          "id": 164,
          "code": "2680",
          "level": null,
          "description": {
              "en": "Manufacture of magnetic and optical media"
          },
          "is_active": 0
      },
      {
          "id": 165,
          "code": "2610",
          "level": null,
          "description": {
              "en": "Manufacture of electronic components and boards"
          },
          "is_active": 0
      },
      {
          "id": 166,
          "code": "5920",
          "level": null,
          "description": {
              "en": "Sound recording and music publishing activities"
          },
          "is_active": 0
      },
      {
          "id": 167,
          "code": "2670",
          "level": null,
          "description": {
              "en": "Manufacture of optical instruments and photographic equipment"
          },
          "is_active": 0
      },
      {
          "id": 168,
          "code": "2651",
          "level": null,
          "description": {
              "en": "Manufacture of measuring, testing, navigating and control equipment"
          },
          "is_active": 0
      },
      {
          "id": 169,
          "code": "26",
          "level": null,
          "description": {
              "en": "Manufacture of computer, electronic and optical products"
          },
          "is_active": 0
      },
      {
          "id": 170,
          "code": "2732",
          "level": null,
          "description": {
              "en": "Manufacture of other electronic and electric wires and cables"
          },
          "is_active": 0
      },
      {
          "id": 171,
          "code": "2731",
          "level": null,
          "description": {
              "en": "Manufacture of fibre optic cables"
          },
          "is_active": 0
      },
      {
          "id": 172,
          "code": "2733",
          "level": null,
          "description": {
              "en": "Manufacture of wiring devices"
          },
          "is_active": 0
      },
      {
          "id": 173,
          "code": "27",
          "level": null,
          "description": {
              "en": "Manufacture of electrical equipment"
          },
          "is_active": 0
      },
      {
          "id": 174,
          "code": "3020",
          "level": null,
          "description": {
              "en": "Manufacture of railway locomotives and rolling stock"
          },
          "is_active": 0
      },
      {
          "id": 175,
          "code": "2920",
          "level": null,
          "description": {
              "en": "Manufacture of bodies (coachwork) for motor vehicles; manufacture of trailers and semi-trailers"
          },
          "is_active": 0
      },
      {
          "id": 176,
          "code": "3040",
          "level": null,
          "description": {
              "en": "Manufacture of military fighting vehicles"
          },
          "is_active": 0
      },
      {
          "id": 177,
          "code": "3091",
          "level": null,
          "description": {
              "en": "Manufacture of motorcycles"
          },
          "is_active": 0
      },
      {
          "id": 178,
          "code": "3092",
          "level": null,
          "description": {
              "en": "Manufacture of bicycles and invalid carriages"
          },
          "is_active": 0
      },
      {
          "id": 179,
          "code": "3099",
          "level": null,
          "description": {
              "en": "Manufacture of other transport equipment n.e.c."
          },
          "is_active": 0
      },
      {
          "id": 180,
          "code": "3011",
          "level": null,
          "description": {
              "en": "Building of ships and floating structures"
          },
          "is_active": 0
      },
      {
          "id": 181,
          "code": "3012",
          "level": null,
          "description": {
              "en": "Building of pleasure and sporting boats"
          },
          "is_active": 0
      },
      {
          "id": 182,
          "code": "2660",
          "level": null,
          "description": {
              "en": "Manufacture of irradiation, electromedical and electrotherapeutic equipment"
          },
          "is_active": 0
      },
      {
          "id": 183,
          "code": "2652",
          "level": null,
          "description": {
              "en": "Manufacture of watches and clocks"
          },
          "is_active": 0
      },
      {
          "id": 184,
          "code": "321",
          "level": null,
          "description": {
              "en": "Manufacture of jewellery, bijouterie and related articles"
          },
          "is_active": 0
      },
      {
          "id": 185,
          "code": "3220",
          "level": null,
          "description": {
              "en": "Manufacture of musical instruments"
          },
          "is_active": 0
      },
      {
          "id": 186,
          "code": "2520",
          "level": null,
          "description": {
              "en": "Manufacture of weapons and ammunition"
          },
          "is_active": 0
      },
      {
          "id": 187,
          "code": "3100",
          "level": null,
          "description": {
              "en": "Manufacture of furniture"
          },
          "is_active": 0
      },
      {
          "id": 188,
          "code": "3240",
          "level": null,
          "description": {
              "en": "Manufacture of games and toys"
          },
          "is_active": 0
      },
      {
          "id": 189,
          "code": "9000",
          "level": null,
          "description": {
              "en": "Creative, arts and entertainment activities"
          },
          "is_active": 0
      },
      {
          "id": 190,
          "code": "5310",
          "level": null,
          "description": {
              "en": "Postal activities"
          },
          "is_active": 0
      },
      {
          "id": 191,
          "code": "9102",
          "level": null,
          "description": {
              "en": "Museums activities and operation of historical sites and buildings"
          },
          "is_active": 0
      }
  ]
    
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