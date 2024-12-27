import { Component, Injector, OnInit } from "@angular/core";
import { BehaviorSubject, Observable, Subscription, first, of } from "rxjs";
import { ICreateAccount, inits } from "../create-account.helper";
import Swal from "sweetalert2";
import { InsighterRegistraionService } from "src/app/_fake/services/insighter-registraion/insighter-registraion.service";
import { Message } from "primeng/api";
import { Router } from "@angular/router";
import { BaseComponent } from "src/app/modules/base.component";
import { TranslationService } from "src/app/modules/i18n";
import { AuthService } from "src/app/modules/auth";
import { IForsightaProfile } from "src/app/_fake/models/profile.interface";
import { ProfileService } from "src/app/_fake/services/get-profile/get-profile.service";
@Component({
  selector: "app-vertical",
  templateUrl: "./vertical.component.html",
})
export class VerticalComponent extends BaseComponent implements OnInit {
  private baseFormsCount = 4;
  formsCount$ = new BehaviorSubject<number>(this.baseFormsCount);
  onSuccessMessage: boolean = false;
  onPendingMessage: boolean = false;
  user: IForsightaProfile;
  userRoles: string[] = [];
  formsCount = 4;
  messages: Message[] = [];
  account$: BehaviorSubject<ICreateAccount> =
    new BehaviorSubject<ICreateAccount>(inits);
  currentStep$: BehaviorSubject<number> = new BehaviorSubject(1);
  isCurrentFormValid$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  isLoadingSubmit$: Observable<boolean> = of(false);
  lang: string = "en";
  constructor(
    private insighterRegistraionService: InsighterRegistraionService,
    private router: Router,
    private translateService: TranslationService,
    private auth: AuthService,
    injector: Injector,
      private getProfileService: ProfileService,
  ) {
    super(injector);
    this.isLoadingSubmit$ = this.insighterRegistraionService.isLoading$;
  }

  ngOnInit(): void {
    this.translateService.onLanguageChange().subscribe((lang) => {
      this.lang = lang;
    });
    this.checkUserRoleAndVerificaiton();
  }

  checkUserRoleAndVerificaiton() {
    const authSub = this.getProfileService.getProfile().subscribe({
      next: (res) => {},
      error: (error) => {
        this.messages.push({
          severity: "error",
          summary: "",
          detail: "Error fetchingUsers",
        });
      },
    });
    this.unsubscribe.push(authSub);
  }

  updateAccount = (part: Partial<ICreateAccount>, isFormValid: boolean) => {
    const currentAccount = this.account$.value;
    const updatedAccount = { ...currentAccount, ...part };
    this.account$.next(updatedAccount);
    this.isCurrentFormValid$.next(isFormValid);
    if (part.accountType) {
      if (part.accountType === "corporate") {
        this.formsCount$.next(this.baseFormsCount + 1); // 5 steps
      } else {
        this.formsCount$.next(this.baseFormsCount); // 4 steps
      }
    }
  };

  nextStep() {
    const currentStep = this.currentStep$.value;
    const nextStep = currentStep + 1;
    const formsCount = this.formsCount$.value;
    if (nextStep === formsCount) {
      Swal.fire({
        title: this.lang == "en" ? "Are you sure?" : "هل انت متأكد ؟",
        text:
          this.lang == "en"
            ? "Do you want to submit the data?"
            : "هل تريد اعتماد البيانات ؟",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText:
          this.lang == "en" ? "Yes, submit it!" : "نعم ، أرسل الطلب",
        cancelButtonText: this.lang == "en" ? "No, cancel" : "لا ، تراجع",
      }).then((result) => {
        if (result.isConfirmed) {
          this.submit();
        } else {
          // User canceled, do nothing
        }
      });
      return;
    }
    this.currentStep$.next(nextStep);
  }

  toUploadInsighta() {
    this.router.navigate(["/app"]);
  }

  prevStep() {
    const prevStep = this.currentStep$.value - 1;
    if (prevStep === 0) {
      return;
    }
    this.currentStep$.next(prevStep);
  }

  ngOnDestroy() {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }

  preparePersonalData(user:ICreateAccount){
    const industriesList = user.isicCodes.filter((node: any) => typeof node.key === 'number');
    const otherIndustriesFields = user.isicCodes.filter((node: any) => 
        typeof node.key === 'string' && node.key !== 'selectAll' && node.data.customInput !== undefined  && node.data.customInput !== null
    );
    const consultingFieldList = user.consultingFields.filter((node: any) => typeof node.key === 'number');
    const otherConsultingFields = user.consultingFields.filter((node: any) => 
        typeof node.key === 'string' && node.key !== 'selectAll' && node.data.customInput !== undefined  && node.data.customInput !== null
    );
    const formData = new FormData();
    formData.append("bio", user.bio ? user.bio : "");
    if (user.phoneNumber) {
      const userPhoneNumber = user.phoneCountryCode.code + user.phoneNumber;
      formData.append("phone", userPhoneNumber);
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

    // Append each certification
    if (user.certifications && user.certifications.length > 0) {
      user.certifications?.forEach((certification, index) => {
        formData.append(
          `certification[${index}][type]`,
          certification.type
        );
        formData.append(
          `certification[${index}][file]`,
          certification.file
        );
      });
    }
    const formDataEntries: Array<{ key: string; value: string }> = [];
    formData.forEach((value, key) => {
      formDataEntries.push({ key, value: value.toString() });
    });
    return formData
  }

  prepareCorporateAccount(user:ICreateAccount){
 
    const formData = new FormData();
    formData.append("about_us", user.aboutCompany ? user.aboutCompany : "");
    formData.append("legal_name", user.legalName ? user.legalName : "");
    formData.append("address", user.companyAddress ? user.companyAddress : "");
    formData.append("logo", user.logo!);
    if (user.verificationMethod === "websiteEmail") {
      formData.append("website", user.website ? user.website : "");
      formData.append(
        "verified_email",
        user.companyEmail ? user.companyEmail : ""
      );
      formData.append("code", user.code ? user.code : "");
    } else if (user.verificationMethod === "uploadDocument") {
      if (user.registerDocument) {
        formData.append("register_document", user.registerDocument);
      }
    }
    if (user.phoneCompanyNumber) {
      const userPhoneNumber = user.phoneCountryCode.code + user.phoneCompanyNumber;
      formData.append("company_phone", userPhoneNumber);
    }
    
   
    const industriesList = user.isicCodes.filter((node: any) => typeof node.key === 'number');
    const otherIndustriesFields = user.isicCodes.filter((node: any) => 
        typeof node.key === 'string' && node.key !== 'selectAll' && node.data.customInput !== undefined  && node.data.customInput !== null
    );
    const consultingFieldList = user.consultingFields.filter((node: any) => typeof node.key === 'number');
    const otherConsultingFields = user.consultingFields.filter((node: any) => 
        typeof node.key === 'string' && node.key !== 'selectAll' && node.data.customInput !== undefined  && node.data.customInput !== null
    );
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

    // Append each certification
    if (user.certifications && user.certifications.length > 0) {
      user.certifications?.forEach((certification, index) => {
        formData.append(
          `certification[${index}][type]`,
          certification.type
        );
        formData.append(
          `certification[${index}][file]`,
          certification.file
        );
      });
    }
    const formDataEntries: Array<{ key: string; value: string }> = [];
    formData.forEach((value, key) => {
      formDataEntries.push({ key, value: value.toString() });
    });
    return formData
  }
  submit() {
    this.account$.pipe(first()).subscribe((account) => {
      const user = account;
      if (user.accountType === "personal") {
        const formData = this.preparePersonalData(user)
        // Call the service
        const insigheterSub = this.insighterRegistraionService
          .personalInsighterRegister(formData)
          .subscribe({
            next: (response) => {
              this.onSuccessMessage = true;
              const profileSub = this.getProfileService.getProfile(true).subscribe();
              this.unsubscribe.push(profileSub);
              this.getProfileService.clearProfile()
            },
            error: (error) => {
              this.handleServerErrors(error);
            },
          });
        this.unsubscribe.push(insigheterSub);
      } else {
        const formData = this.prepareCorporateAccount(user)
        const insigheterSub = this.insighterRegistraionService
          .corporateInsighterRegister(formData)
          .subscribe({
            next: (response) => {
              if(user.verificationMethod === "uploadDocument"){
                this.onPendingMessage=true
              }else{
                this.onSuccessMessage=true;
                const profileSub = this.getProfileService.getProfile(true).subscribe();
                this.unsubscribe.push(profileSub);
              }
              this.getProfileService.clearProfile()
            },
            error: (error) => {
              this.handleServerErrors(error);
            },
          });

        this.unsubscribe.push(insigheterSub);
      }
    });

  }

  private handleServerErrors(error: any) {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
         this.showError('',messages.join(", "),10000);
        }
      }
    } else {
  
      this.showError('','An unexpected error occurred.');
    }
  }
}
