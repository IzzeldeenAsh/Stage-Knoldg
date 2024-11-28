import {
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
} from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { BehaviorSubject, Subscription, fromEvent, map, startWith, take, timer } from "rxjs";

import { ICreateAccount } from "../../create-account.helper";
import {
  ConsultingFieldsService,
} from "src/app/_fake/services/admin-consulting-fields/consulting-fields.service";
import { Message, MessageService } from "primeng/api";
import { TranslationService } from "src/app/modules/i18n";
import { IsicCodesService } from "src/app/_fake/services/isic-code/isic-codes.service";
import { HttpClient } from "@angular/common/http";
@Component({
  selector: "app-step5",
  templateUrl: "./step5.component.html",
})
export class Step5Component implements OnInit, OnDestroy {
  messages: Message[] = [];
  lang: string;
  dialogWidth: string = "50vw";
  reverseLoader: boolean = false;
  gettingCodeLoader:boolean=false;
  @Input("updateParentModel") updateParentModel: (
    part: Partial<ICreateAccount>,
    isFormValid: boolean
  ) => void;
  form: FormGroup;
  @Input() defaultValues: Partial<ICreateAccount>;
  @ViewChild("fileInput") fileInput: ElementRef<HTMLInputElement>;
  resizeSubscription!: Subscription;
  isGetCodeDisabled: boolean = false;
  getCodeCountdown$ = new BehaviorSubject<number | null>(null);
  private unsubscribe: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private _translateion: TranslationService,
    private http: HttpClient,
    private messageService: MessageService,
  ) {
    this.lang = this._translateion.getSelectedLanguage();
  }

  ngOnInit() {
    this.windowResize();
    this.initForm();
    this.updateParentModel({}, this.checkForm());
    this._translateion.onLanguageChange().subscribe((lang) => {
      this.lang = lang;
    });
    if (this.defaultValues?.registerDocument) {
      this.form.patchValue({
        registerDocument: this.defaultValues?.registerDocument,
      });
      this.form.get("registerDocument")?.markAsTouched();
      this.updateParentModel(
        { registerDocument: this.defaultValues?.registerDocument },
        this.checkForm()
      );
    }
  }

  windowResize() {
    const screenwidth$ = fromEvent(window, "resize").pipe(
      map(() => window.innerWidth),
      startWith(window.innerWidth)
    );

    this.resizeSubscription = screenwidth$.subscribe((width) => {
      this.dialogWidth = width < 768 ? "100vw" : "70vw";
      console.log(this.dialogWidth);
    });
  }
  onDropzoneClick() {
    this.fileInput.nativeElement.click();
  }
  getCode() {
    const email = this.form.get('companyEmail')?.value;
    if (email) {
      this.gettingCodeLoader = true;
      this.http.post('https://api.foresighta.co/api/auth/company/code/send', {
        verified_email: email,
      }).subscribe({
        next: (response) => {
          // Handle success (e.g., show a success message)
          console.log('Code sent successfully:', response);
          this.messageService.add({ 
            severity: 'success', 
            summary: 'Success', 
            detail: 'Verification email resent successfully.' 
          });
          this.gettingCodeLoader = false;
          this.startGetCodeCooldown();
        },
        error: (error) => {
          // Handle error (e.g., show an error message)
          console.error('Error sending code:', error);
          const errorMsg = error?.error?.message || 'Failed to resend verification code.';
          this.messageService.add({ 
            severity: 'error', 
            summary: 'Error', 
            detail: errorMsg 
          });
          this.gettingCodeLoader = false;
        }
      });
    }
  }
  startGetCodeCooldown(): void {
    const countdownTime = 30; // seconds

    this.isGetCodeDisabled = true;
    this.getCodeCountdown$.next(countdownTime);
    
    const resendTimerSubscription = timer(0, 1000).pipe(
      take(countdownTime)
    ).subscribe({
      next: (elapsedTime) => {
        const remainingTime = countdownTime - elapsedTime - 1;
        this.getCodeCountdown$.next(remainingTime >= 0 ? remainingTime : 0);
      },
      complete: () => {
        this.getCodeCountdown$.next(null);
        this.isGetCodeDisabled = false;
      }
    });

    if (resendTimerSubscription) {
      this.unsubscribe.push(resendTimerSubscription)
    }
  }
  // Handle file selection from the file input
  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.form.patchValue({ registerDocument: file });
      this.form.get("registerDocument")?.markAsTouched();
      this.updateParentModel({ registerDocument: file }, this.checkForm());
    }
  }

  // Prevent default drag over behavior
  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  // Handle files dropped into the dropzone
  onFileDrop(event: DragEvent) {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files.item(0);
      this.form.patchValue({ registerDocument: file });
      this.form.get("registerDocument")?.markAsTouched();
      this.updateParentModel({ registerDocument: file }, this.checkForm());
    }
  }

  // Remove the uploaded register document
  removeRegisterDocument() {
    this.form.patchValue({ registerDocument: null });
    this.updateParentModel({ registerDocument: null }, this.checkForm());
    this.fileInput.nativeElement.value = "";
  }

  // Get the icon path based on the file extension
  getFileIcon(file: File): string {
    const extension = file.name.split(".").pop()?.toLowerCase();
    const iconPath = `./assets/media/svg/files/${extension}.svg`;
    // If the icon doesn't exist, you can return a default icon path
    return iconPath;
  }

  initForm() {
    this.form = this.fb.group(
      {
        verificationMethod: ['websiteEmail', Validators.required],
        website: [''],
        companyEmail: [''],
        code: [''],
        registerDocument: [null],

      },
      { validators:this.verificationMethodValidator() }
    );

    const formChangesSubscr = this.form.valueChanges.subscribe((val) => {
      this.updateParentModel(val, this.checkForm());
    });
    this.unsubscribe.push(formChangesSubscr);
    
  }

  verificationMethodValidator(){
    return (group:FormGroup)=>{
      const verificationMethod = group.get('verificationMethod')?.value;
      if (verificationMethod === 'websiteEmail') {
        const website = group.get('website')?.value;
        const companyEmail = group.get('companyEmail')?.value;
        const code = group.get('code')?.value;
        if (!website || !companyEmail || !code) {
          return { websiteEmailRequired: true };
        }
      }else if (verificationMethod === 'uploadDocument') {
        const registerDocument = group.get('registerDocument')?.value;
        if (!registerDocument) {
          return { registerDocumentRequired: true };
        }
      }
      return null;
    }
  }

  atLeastOneRequired(...fields: string[]) {
    return (group: FormGroup) => {
      const hasAtLeastOne = fields.some((fieldName) => {
        const field = group.get(fieldName);
        return field && field.value && field.value !== "";
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
