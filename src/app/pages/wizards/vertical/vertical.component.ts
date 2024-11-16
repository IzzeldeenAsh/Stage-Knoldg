import { Component, OnDestroy, OnInit } from "@angular/core";
import { BehaviorSubject, Observable, Subscription, first, of } from "rxjs";
import { ICreateAccount, inits } from "../create-account.helper";
import Swal from 'sweetalert2';
import { InsighterRegistraionService } from "src/app/_fake/services/insighter-registraion/insighter-registraion.service";
import { Message } from "primeng/api";
@Component({
  selector: "app-vertical",
  templateUrl: "./vertical.component.html",
})
export class VerticalComponent implements OnInit, OnDestroy {
  formsCount = 4;
  messages: Message[] = [];
  account$: BehaviorSubject<ICreateAccount> =
    new BehaviorSubject<ICreateAccount>(inits);
  currentStep$: BehaviorSubject<number> = new BehaviorSubject(1);
  isCurrentFormValid$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false
  );
  private unsubscribe: Subscription[] = [];
  isLoadingSubmit$: Observable<boolean> = of(false);
  constructor(private insighterRegistraionService: InsighterRegistraionService) {
    this.isLoadingSubmit$ = this.insighterRegistraionService.isLoading$
  }

  ngOnInit(): void {}

  updateAccount = (part: Partial<ICreateAccount>, isFormValid: boolean) => {
    const currentAccount = this.account$.value;
    const updatedAccount = { ...currentAccount, ...part };
    this.account$.next(updatedAccount);
    this.isCurrentFormValid$.next(isFormValid);
    console.log("updatedAccount", updatedAccount);
  };

  nextStep() {
    const nextStep = this.currentStep$.value + 1;

    if (nextStep === 4) {
      Swal.fire({
        title: 'Are you sure?',
        text: 'Do you want to submit the data?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, submit it!',
        cancelButtonText: 'No, cancel',
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

  submit() {
    this.account$.pipe(first()).subscribe((account) => {
      const user = account;
      if (user.accountType === "personal") {
        const userPhoneNumber = user.phoneCountryCode.code + user.phoneNumber;
        const formData = new FormData();
        formData.append("bio", user.bio ? user.bio : "");
        formData.append("phone", userPhoneNumber);
        user.isicCodes.forEach((code: any) => {
          formData.append("isic_code[]", code.key.toString());
        });
        user.consultingFields.forEach((field: any) => {
          formData.append("consulting_field[]", field.id.toString());
        });
        // Append each certification
        if(user.certifications && user.certifications.length>0){
          user.certifications?.forEach((certification, index) => {
            formData.append(`certification[${index}][type]`, certification.file.type);
            formData.append(`certification[${index}][file]`, certification.file);
          });
        }
        const formDataEntries: Array<{ key: string; value: string }> = [];
        formData.forEach((value, key) => {
          formDataEntries.push({ key, value: value.toString() });
        });
        console.table(formDataEntries);
  // Call the service
  this.insighterRegistraionService.personalInsighterRegister(formData).subscribe(
    {
      next :(response)=> {
          console.log('Submission successful:', response);
        this.currentStep$.next(4);
        },
      error:    (error) => {
     this.handleServerErrors(error);
    }
    }
  
  );
      }else{
        const userPhoneNumber = user.phoneCountryCode.code + user.phoneNumber;
        const formData = new FormData();
        formData.append("about_us", user.aboutCompany ? user.aboutCompany : "");
        formData.append("legal_name", user.legalName ? user.legalName : '');
        formData.append("website", user.website ? user.website : '');
       if(user.registerDocument){
        formData.append("register_document", user.registerDocument ? user.registerDocument : '');
       }
        formData.append("phone", userPhoneNumber);
        user.isicCodes.forEach((code: any) => {
          formData.append("isic_code[]", code.key.toString());
        });
        user.consultingFields.forEach((field: any) => {
          formData.append("consulting_field[]", field.id.toString());
        });
        // Append each certification
        if(user.certifications && user.certifications.length>0){
          user.certifications?.forEach((certification, index) => {
            formData.append(`certification[${index}][type]`, certification.file.type);
            formData.append(`certification[${index}][file]`, certification.file);
          });
        }
        const formDataEntries: Array<{ key: string; value: string }> = [];
        formData.forEach((value, key) => {
          formDataEntries.push({ key, value: value.toString() });
        });
        console.table(formDataEntries);
        this.insighterRegistraionService.corporateInsighterRegister(formData).subscribe(
          {
            next :(response)=> {
                console.log('Submission successful:', response);
              this.currentStep$.next(4);
              },
            error:    (error) => {
           this.handleServerErrors(error);
          }
          }
        
        );
      }
    });

    console.log("Submit Triggerd");
   
  }

  private handleServerErrors(error: any) {
    this.messages = [];
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          this.messages.push({ severity: 'error', summary: '', detail: messages.join(', ') });
        }
      }
    } else {
      this.messages.push({
        severity: 'error',
        summary: 'Error',
        detail: 'An unexpected error occurred.',
      });
    }
  }

}
