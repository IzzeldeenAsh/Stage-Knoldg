import { Component, Injector, OnInit, ViewChild } from "@angular/core";
import { BehaviorSubject, Observable, Subscription, first, of } from "rxjs";
import { ICreateAccount, inits } from "../create-account.helper";
import Swal from "sweetalert2";
import { InsighterRegistraionService } from "src/app/_fake/services/insighter-registraion/insighter-registraion.service";
import { Message } from "primeng/api";
import { Router } from "@angular/router";
import { BaseComponent } from "src/app/modules/base.component";
import { TranslationService } from "src/app/modules/i18n";
import { AuthService } from "src/app/modules/auth";
import { IKnoldgProfile } from "src/app/_fake/models/profile.interface";
import { ProfileService } from "src/app/_fake/services/get-profile/get-profile.service";
import { CommonService } from "src/app/_fake/services/common/common.service";
import { Step3Component } from "../steps/step3/step3.component";
import { Step5Component } from "../steps/step5/step5.component";

@Component({
  selector: "app-vertical",
  templateUrl: "./vertical.component.html",
})
export class VerticalComponent extends BaseComponent implements OnInit {
  @ViewChild(Step3Component) step3Component: Step3Component;
  @ViewChild(Step5Component) step5Component: Step5Component;
  
  formsCount$ = new BehaviorSubject<number>(3); // Default to 3 steps (for personal)
  onSuccessMessage: boolean = false;
  onPendingMessage: boolean = false;
  user: IKnoldgProfile;
  userRoles: string[] = [];
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
    private commonService: CommonService,
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
    
    // Update the forms count based on account type
    if (part.accountType) {
      // For corporate accounts, we have 4 steps total (last step is verification)
      // For personal accounts, we have 3 steps total (last step is certifications)
      if (part.accountType === "corporate") {
        this.formsCount$.next(4); // 4 steps total for corporate (step 4 is verification)
      } else {
        this.formsCount$.next(3); // 3 steps total for personal
      }
    }
  };

  nextStep() {
    const currentStep = this.currentStep$.value;
    const accountType = this.account$.value.accountType;
    const formsCount = this.formsCount$.value;
    
    // Check if we're at the last step for account type
    if (currentStep === 3 && accountType === 'personal') {
      // For personal accounts, step 3 is the final step, so submit instead of navigating
      this.submit();
      return;
    } else if (currentStep === 4 && accountType === 'corporate') {
      // For corporate accounts, step 4 is the final step, so submit instead of navigating
      this.submit();
      return;
    }
    
    // Validate the current step before proceeding
    if (currentStep === 3 && this.step3Component) {
      // For step 3, check if agreement is valid but only for personal accounts
      if (accountType === 'personal' && !this.step3Component.prepareForSubmit()) {
        return; // Stop if validation fails for personal accounts
      } else if (accountType === 'corporate') {
        // For corporate accounts, just check form validity without agreement
        if (!this.step3Component.form.valid) {
          return; // Stop if form validation fails
        }
      }
    } else if (currentStep === 4 && this.step5Component) {
      // For step 4 (which uses step5 component for corporate account), check if agreement is valid
      if (!this.step5Component.prepareForSubmit()) {
        return; // Stop if validation fails
      }
    }
    
    const nextStep = currentStep + 1;
    
    if (nextStep > formsCount) {
      return; // Don't exceed the maximum number of steps
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

    // Add insighter agreement 
    formData.append("insighter_agreement", "true");

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

    // Add company agreement
    formData.append("company_agreement", "true");

    const formDataEntries: Array<{ key: string; value: string }> = [];
    formData.forEach((value, key) => {
      formDataEntries.push({ key, value: value.toString() });
    });
    return formData
  }
  submit() {
    // Check if the current step is valid before submitting
    if (this.currentStep$.value === 3 && this.step3Component) {
      // For personal accounts (step 3)
      if (!this.step3Component.prepareForSubmit()) {
        return; // Stop if validation fails
      }
    } else if (this.currentStep$.value === 4 && this.step5Component) {
      // For corporate accounts (step 5 component)
      if (!this.step5Component.prepareForSubmit()) {
        return; // Stop if validation fails
      }
    }
    
    this.account$.pipe(first()).subscribe((account) => {
      const user = account;
      
      // Check for appropriate agreement based on account type
      const hasAgreed = user.accountType === "personal" 
        ? user.insighterAgreement 
        : user.companyAgreement;
      
      if (!hasAgreed) {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: user.accountType === "personal" 
            ? 'You must agree to the Insighter Terms of Service to proceed.' 
            : 'You must agree to the Company Terms of Service to proceed.' 
        });
        return;
      }
      
      if (user.accountType === "personal") {
        const formData = this.preparePersonalData(user)
        // Call the service
        const insigheterSub = this.insighterRegistraionService
          .personalInsighterRegister(formData)
          .subscribe({
            next: (response) => {
              this.onSuccessMessage = true;
              // Refresh profile to get updated roles
              const profileSub = this.getProfileService.refreshProfile().subscribe({
                next: (profile) => {
                  // Update userRoles with the new roles 
                  this.userRoles = profile.roles || [];
                }
              });
              this.unsubscribe.push(profileSub);
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
                // Refresh profile to get updated roles
                const profileSub = this.getProfileService.refreshProfile().subscribe({
                  next: (profile) => {
                    // Update userRoles with the new roles 
                    this.userRoles = profile.roles || [];
                  }
                });
                this.unsubscribe.push(profileSub);
              }
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
