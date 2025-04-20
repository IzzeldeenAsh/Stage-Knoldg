import { InsighterAsCompany } from "./../../../../../_fake/services/register-insighter-as-company/register-insighter-as-company.service";
// upgrade-to-corporate.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
  Injector,
} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import {
  Subscription,
  BehaviorSubject,
  timer,
  Observable,
  take,
  map,
  fromEvent,
  startWith,
} from "rxjs";
import { TranslationService } from "src/app/modules/i18n";
import { HttpClient } from "@angular/common/http";
import { Message, MessageService } from "primeng/api";
import { ScrollAnimsService } from "src/app/_fake/services/scroll-anims/scroll-anims.service";
import Swal from "sweetalert2";
import { Router } from "@angular/router";
import { BaseComponent } from "src/app/modules/base.component";
import { CommonService } from "src/app/_fake/services/common/common.service";

@Component({
  selector: "app-upgrade-to-company",
  templateUrl: "./upgrade-to-company.component.html",
  styleUrl: "./upgrade-to-company.component.scss",
})
export class UpgradeToCompanyComponent
  extends BaseComponent
  implements OnInit, OnDestroy
{
  form: FormGroup;
  logoPreview: string | ArrayBuffer | null = null;
  gettingCodeLoader = false;
  isGetCodeDisabled = false;
  getCodeCountdown$ = new BehaviorSubject<number | null>(null);
  updateProfile$: Observable<boolean>;
  dialogWidth: string = "50vw";
  @ViewChild("logoInput") logoInput: ElementRef<HTMLInputElement>;
  @ViewChild("fileInput") fileInput: ElementRef<HTMLInputElement>;
  defaultImage =
    "https://au.eragroup.com/wp-content/uploads/2018/02/logo-placeholder.png";

  // Agreement properties
  agreementChecked: boolean = false;
  showAgreementError: boolean = false;
  agreementContent: any = null;
  isLoadingAgreement: boolean = false;
  showAgreementDialog: boolean = false;
  attemptedSubmit: boolean = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private insighterAsCompany: InsighterAsCompany,
    private router: Router,
    private commonService: CommonService,
    injector: Injector
  ) {
    super(injector);
    this.updateProfile$ = this.insighterAsCompany.isLoading$;
  }

  ngOnInit(): void {
    this.initForm();
    this.windowResize();

    const verificationMethodSub = this.form
      .get("verificationMethod")
      ?.valueChanges.subscribe((method) => {
        this.setVerificationValidators(method);
      });
    if (verificationMethodSub) this.unsubscribe.push(verificationMethodSub);

    // Initialize validators based on the default verification method
    this.setVerificationValidators(this.form.get("verificationMethod")?.value);
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }

  windowResize() {
    const screenwidth$ = fromEvent(window, "resize").pipe(
      map(() => window.innerWidth),
      startWith(window.innerWidth)
    );

    const resizeSubscription = screenwidth$.subscribe((width) => {
      this.dialogWidth = width < 768 ? "100vw" : "70vw";
    });
    
    this.unsubscribe.push(resizeSubscription);
  }

  // Open the agreement dialog to view the full terms
  openAgreementDialog(event?: any) {
    // If event exists but not from p-checkbox, it's a click on the checkbox, so prevent immediate toggling
    if (event && event.originalEvent) {
      // This is from p-checkbox onChange, skip the dialog if it's checked/unchecked directly
      // Only show dialog when unchecking
      if (!event.checked) {
        this.form.get('agreement')?.setValue(false);
        this.showAgreementError = this.attemptedSubmit;
        return;
      }
    }
    
    this.isLoadingAgreement = true;
    this.showAgreementDialog = true;
    
    this.commonService.getClientAgreement('company-agreement').subscribe({
      next: (response) => {
        this.agreementContent = response.data;
        this.isLoadingAgreement = false;
      },
      error: (error) => {
        console.error('Error loading agreement:', error);
        this.isLoadingAgreement = false;
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to load agreement. Please try again.' 
        });
      }
    });
  }
  
  // Accept the agreement terms
  acceptAgreement() {
    this.form.get('agreement')?.setValue(true);
    this.form.get('agreement')?.markAsTouched();
    this.showAgreementDialog = false;
    this.showAgreementError = false;
  }

  // Decline the agreement terms
  declineAgreement() {
    this.form.get('agreement')?.setValue(false);
    this.form.get('agreement')?.markAsTouched();
    this.showAgreementDialog = false;
    this.showAgreementError = true;
  }

  // Print terms document in a new window
  printTerms(): void {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      // Prepare content for printing
      const termsTitle = this.agreementContent?.name || 'Company Terms of Service';
      const termsContent = this.agreementContent?.guideline || '';
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${termsTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
            h1 { color: #333; text-align: center; margin-bottom: 20px; }
            .content { margin: 0 auto; max-width: 800px; }
          </style>
        </head>
        <body>
          <h1>${termsTitle}</h1>
          <div class="content">${termsContent}</div>
        </body>
        </html>
      `;
      
      printWindow.document.open();
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      this.messageService.add({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Could not open print window. Please check your browser settings.' 
      });
    }
  }

  // Save terms as a text file
  saveTerms(): void {
    if (this.agreementContent) {
      const termsTitle = this.agreementContent.name || 'Company-Terms-of-Service';
      const termsText = this.stripHtmlTags(this.agreementContent.guideline);
      
      // Create a Blob with the text content
      const blob = new Blob([termsText], { type: 'text/plain' });
      
      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${termsTitle.replace(/\s+/g, '-')}.txt`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  }

  // Helper method to strip HTML tags from content
  private stripHtmlTags(html: string): string {
    // Create a temporary element to extract text from HTML
    const tempElement = document.createElement('div');
    tempElement.innerHTML = html;
    return tempElement.textContent || tempElement.innerText || '';
  }

  initForm() {
    this.form = this.fb.group({
      legalName: ["", Validators.required],
      aboutCompany: ["", Validators.required],
      logo: [null, Validators.required],
      address: ["", Validators.required],
      company_phone: ["", Validators.required],
      verificationMethod: ["websiteEmail", Validators.required],
      website: [""],
      companyEmail: ["", Validators.email],
      code: [""],
      registerDocument: [null],
      agreement: [false, Validators.requiredTrue]
    });
  }

  setVerificationValidators(method: string) {
    if (method === "websiteEmail") {
      this.form.get("website")?.setValidators([Validators.required]);
      this.form
        .get("companyEmail")
        ?.setValidators([Validators.required, Validators.email]);
      this.form.get("code")?.setValidators([Validators.required]);

      this.form.get("registerDocument")?.clearValidators();
      this.form.get("registerDocument")?.setValue(null);
    } else if (method === "uploadDocument") {
      this.form.get("registerDocument")?.setValidators([Validators.required]);

      this.form.get("website")?.clearValidators();
      this.form.get("companyEmail")?.clearValidators();
      this.form.get("code")?.clearValidators();

      this.form.get("website")?.setValue("");
      this.form.get("companyEmail")?.setValue("");
      this.form.get("code")?.setValue("");
    }

    this.form.get("website")?.updateValueAndValidity();
    this.form.get("companyEmail")?.updateValueAndValidity();
    this.form.get("code")?.updateValueAndValidity();
    this.form.get("registerDocument")?.updateValueAndValidity();
  }

  onLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const validTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        this.messageService.add({
          severity: "error",
          summary: "Invalid File Type",
          detail: "Please select a PNG or JPEG image.",
        });
        this.form.get("logo")?.setErrors({ invalidType: true });
        return;
      }
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        this.messageService.add({
          severity: "error",
          summary: "File Too Large",
          detail: "Logo must be smaller than 2MB.",
        });
        this.form.get("logo")?.setErrors({ maxSizeExceeded: true });
        return;
      }

      // Check image dimensions for high quality
      const img = new Image();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target) {
          img.src = e.target.result as string;
          img.onload = () => {
            const minWidth = 500; // Minimum width in pixels
            const minHeight = 300; // Minimum height in pixels
            
            if (img.width < minWidth || img.height < minHeight) {
              this.messageService.add({
                severity: "error",
                summary: "Low Resolution Image",
                detail: `Logo must be at least ${minWidth}x${minHeight} pixels for high quality.`,
              });
              this.form.get("logo")?.setErrors({ lowResolution: true });
              this.logoPreview = null;
              if (this.logoInput) {
                this.logoInput.nativeElement.value = "";
              }
              return;
            }
            
            // Image passed all quality checks
            this.form.patchValue({ logo: file });
            this.form.get("logo")?.updateValueAndValidity();
            this.logoPreview = img.src;
          };
        }
      };
      
      reader.readAsDataURL(file);
    }
  }

  removeLogo() {
    this.form.patchValue({ logo: null });
    this.logoPreview = null;
    if (this.logoInput) {
      this.logoInput.nativeElement.value = "";
    }
  }

  getLogoBackgroundImage() {
    return `url(${this.logoPreview || this.defaultImage})`;
  }

  getCode() {
    const email = this.form.get("companyEmail")?.value;
    if (email) {
      this.gettingCodeLoader = true;
      const getCodeSub = this.http
        .post("https://api.knoldg.com/api/auth/company/code/send", {
          verified_email: email,
        }, {
          headers: {
            'Accept-Language': 'en'
          }
        })
        .subscribe({
          next: (response) => {
            this.messageService.add({
              severity: "success", 
              summary: "Success",
              detail: "Verification email sent successfully.",
            });
            this.gettingCodeLoader = false;
            this.startGetCodeCooldown();
          },
          error: (error) => {
            console.error("Error sending code:", error);
            const errorMsg =
              error?.error?.message || "Failed to send verification code.";
            this.messageService.add({
              severity: "error",
              summary: "Error", 
              detail: errorMsg,
            });
            this.gettingCodeLoader = false;
          },
        });
      this.unsubscribe.push(getCodeSub);
    }
  }

  startGetCodeCooldown(): void {
    const countdownTime = 30; // seconds

    this.isGetCodeDisabled = true;
    this.getCodeCountdown$.next(countdownTime);

    const countdown$ = timer(0, 1000).pipe(
      take(countdownTime + 1), // Ensure the timer completes after countdownTime seconds
      map((value) => countdownTime - value)
    );

    const resendTimerSubscription = countdown$.subscribe({
      next: (remainingTime) => {
        this.getCodeCountdown$.next(remainingTime);
      },
      complete: () => {
        this.getCodeCountdown$.next(null);
        this.isGetCodeDisabled = false;
      },
    });

    this.unsubscribe.push(resendTimerSubscription);
  }

  onRegisterDocumentSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.form.patchValue({ registerDocument: file });
      this.form.get("registerDocument")?.updateValueAndValidity();
    }
  }

  removeRegisterDocument() {
    this.form.patchValue({ registerDocument: null });
    if (this.fileInput) {
      this.fileInput.nativeElement.value = "";
    }
  }

  onDropzoneClick() {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.form.patchValue({ registerDocument: file });
      this.form.get("registerDocument")?.updateValueAndValidity();
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files.item(0);
      this.form.patchValue({ registerDocument: file });
      this.form.get("registerDocument")?.updateValueAndValidity();
    }
  }

  getFileIcon(file: File): string {
    const extension = file.name.split(".").pop()?.toLowerCase();
    const iconPath = `./assets/media/svg/files/${extension}.svg`;
    return iconPath;
  }

  onSubmit() {
    this.attemptedSubmit = true;
    
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    formData.append("legal_name", this.form.get("legalName")?.value);
    formData.append("about_us", this.form.get("aboutCompany")?.value);
    formData.append("logo", this.form.get("logo")?.value);
    formData.append("address", this.form.get("address")?.value);
    formData.append("company_phone", this.form.get("company_phone")?.value);
    formData.append("company_agreement", "true"); // Add company agreement

    const verificationMethod = this.form.get("verificationMethod")?.value;

    if (verificationMethod === "websiteEmail") {
      formData.append("website", this.form.get("website")?.value);
      formData.append("verified_email", this.form.get("companyEmail")?.value);
      formData.append("code", this.form.get("code")?.value);
    } else if (verificationMethod === "uploadDocument") {
      formData.append(
        "register_document",
        this.form.get("registerDocument")?.value
      );
    }

    this.apiPost(formData);
  }

  apiPost(formData: FormData) {
    const postProfileSub = this.insighterAsCompany
      .postInsighterToCompany(formData)
      .subscribe({
        next: (res) => {
          Swal.fire({
            icon: "success",
            title:
              this.lang === "ar"
                ? "تم تحديث حسابك بنجاح"
                : "Your account has been successfully updated",
            text:
              this.lang === "ar"
                ? "سنقوم بالتحقق من حسابك بمجرد تأكيد المعلومات."
                : "We will verify your account once the information is confirmed.",
            confirmButtonText: this.lang === "ar" ? "حسناً" : "OK",
            allowOutsideClick: false,
            allowEscapeKey: false
          }).then(() => {
            // Force reload to ensure fresh page state
            window.location.href = window.location.href;
          });
        },
        error: (error) => {
          this.handleServerErrors(error);
        },
      });
    this.unsubscribe.push(postProfileSub);
  }

  private handleServerErrors(error: any) {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          this.form.get(key)?.setErrors({ serverError: messages.join(", ") });
        }
      }
    } else {
      this.messageService.add({
        severity: "error",
        summary: "Error",
        detail: "An unexpected error occurred.",
      });
    }
  }
}
