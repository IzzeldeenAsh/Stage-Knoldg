import { InsighterAsCompany } from './../../../../../_fake/services/register-insighter-as-company/register-insighter-as-company.service';
// upgrade-to-corporate.component.ts

import {
  Component,
  OnInit,
  OnDestroy,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription, BehaviorSubject, timer, Observable, take, map } from 'rxjs';
import { TranslationService } from 'src/app/modules/i18n';
import { HttpClient } from '@angular/common/http';
import { Message, MessageService } from 'primeng/api';
import { ScrollAnimsService } from 'src/app/_fake/services/scroll-anims/scroll-anims.service';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-upgrade-to-company',
  templateUrl: './upgrade-to-company.component.html',
  styleUrl: './upgrade-to-company.component.scss'
})
export class UpgradeToCompanyComponent extends BaseComponent
implements OnInit, OnDestroy
{
form: FormGroup;
logoPreview: string | ArrayBuffer | null = null;
lang: string;
gettingCodeLoader = false;
isGetCodeDisabled = false;
getCodeCountdown$ = new BehaviorSubject<number | null>(null);
updateProfile$: Observable<boolean>;
@ViewChild('logoInput') logoInput: ElementRef<HTMLInputElement>;
@ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement>;
defaultImage =
  'https://au.eragroup.com/wp-content/uploads/2018/02/logo-placeholder.png';

constructor(
  private fb: FormBuilder,
  private http: HttpClient,
  messageService: MessageService,
  private translationService: TranslationService,
  private insighterAsCompany: InsighterAsCompany,
  scrollAnims: ScrollAnimsService,
  private router: Router
) {
  super(scrollAnims, messageService);
  this.lang = this.translationService.getSelectedLanguage();
  this.updateProfile$ = this.insighterAsCompany.isLoading$;
}

ngOnInit(): void {
  this.initForm();

  const langSub = this.translationService
    .onLanguageChange()
    .subscribe((lang) => {
      this.lang = lang;
    });
  this.unsubscribe.push(langSub);

  const verificationMethodSub = this.form
    .get('verificationMethod')
    ?.valueChanges.subscribe((method) => {
      this.setVerificationValidators(method);
    });
    if(verificationMethodSub) this.unsubscribe.push(verificationMethodSub);

  // Initialize validators based on the default verification method
  this.setVerificationValidators(
    this.form.get('verificationMethod')?.value
  );
}

ngOnDestroy(): void {
  this.unsubscribe.forEach((sb) => sb.unsubscribe());
}

initForm() {
  this.form = this.fb.group({
    legalName: ['', Validators.required],
    aboutCompany: ['', Validators.required],
    logo: [null, Validators.required],
    verificationMethod: ['websiteEmail', Validators.required],
    website: [''],
    companyEmail: ['', Validators.email],
    code: [''],
    registerDocument: [null],
  });
}

setVerificationValidators(method: string) {
  if (method === 'websiteEmail') {
    this.form.get('website')?.setValidators([Validators.required]);
    this.form
      .get('companyEmail')
      ?.setValidators([Validators.required, Validators.email]);
    this.form.get('code')?.setValidators([Validators.required]);

    this.form.get('registerDocument')?.clearValidators();
    this.form.get('registerDocument')?.setValue(null);
  } else if (method === 'uploadDocument') {
    this.form.get('registerDocument')?.setValidators([Validators.required]);

    this.form.get('website')?.clearValidators();
    this.form.get('companyEmail')?.clearValidators();
    this.form.get('code')?.clearValidators();

    this.form.get('website')?.setValue('');
    this.form.get('companyEmail')?.setValue('');
    this.form.get('code')?.setValue('');
  }

  this.form.get('website')?.updateValueAndValidity();
  this.form.get('companyEmail')?.updateValueAndValidity();
  this.form.get('code')?.updateValueAndValidity();
  this.form.get('registerDocument')?.updateValueAndValidity();
}

onLogoSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid File Type',
        detail: 'Please select a PNG or JPEG image.',
      });
      this.form.get('logo')?.setErrors({ invalidType: true });
      return;
    }
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      this.messageService.add({
        severity: 'error',
        summary: 'File Too Large',
        detail: 'Logo must be smaller than 2MB.',
      });
      this.form.get('logo')?.setErrors({ maxSizeExceeded: true });
      return;
    }
    this.form.patchValue({ logo: file });
    this.form.get('logo')?.updateValueAndValidity();
    const reader = new FileReader();
    reader.onload = () => {
      this.logoPreview = reader.result;
    };
    reader.readAsDataURL(file);
  }
}

removeLogo() {
  this.form.patchValue({ logo: null });
  this.logoPreview = null;
  if (this.logoInput) {
    this.logoInput.nativeElement.value = '';
  }
}

getLogoBackgroundImage() {
  return `url(${this.logoPreview || this.defaultImage})`;
}

getCode() {
  const email = this.form.get('companyEmail')?.value;
  if (email) {
    this.gettingCodeLoader = true;
    const getCodeSub = this.http
      .post('https://api.foresighta.co/api/auth/company/code/send', {
        verified_email: email,
      })
      .subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Verification email sent successfully.',
          });
          this.gettingCodeLoader = false;
          this.startGetCodeCooldown();
        },
        error: (error) => {
          console.error('Error sending code:', error);
          const errorMsg =
            error?.error?.message || 'Failed to send verification code.';
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
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
    map(value => countdownTime - value)
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
    this.form.get('registerDocument')?.updateValueAndValidity();
  }
}

removeRegisterDocument() {
  this.form.patchValue({ registerDocument: null });
  if (this.fileInput) {
    this.fileInput.nativeElement.value = '';
  }
}

onDropzoneClick() {
  this.fileInput.nativeElement.click();
}

onFileSelected(event: any) {
  const file = event.target.files[0];
  if (file) {
    this.form.patchValue({ registerDocument: file });
    this.form.get('registerDocument')?.updateValueAndValidity();
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
    this.form.get('registerDocument')?.updateValueAndValidity();
  }
}

getFileIcon(file: File): string {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const iconPath = `./assets/media/svg/files/${extension}.svg`;
  return iconPath;
}

onSubmit() {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    return;
  }

  const formData = new FormData();
  formData.append('legal_name', this.form.get('legalName')?.value);
  formData.append('about_us', this.form.get('aboutCompany')?.value);
  formData.append('logo', this.form.get('logo')?.value);

  const verificationMethod = this.form.get('verificationMethod')?.value;

  if (verificationMethod === 'websiteEmail') {
    formData.append('website', this.form.get('website')?.value);
    formData.append('verified_email', this.form.get('companyEmail')?.value);
    formData.append('code', this.form.get('code')?.value);
  } else if (verificationMethod === 'uploadDocument') {
    formData.append(
      'register_document',
      this.form.get('registerDocument')?.value
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
          icon: 'success',
          title:
            this.lang === 'ar'
              ? 'تم تحديث حسابك بنجاح'
              : 'Your account has been successfully updated',
          text:
            this.lang === 'ar'
              ? 'سنقوم بالتحقق من حسابك بمجرد تأكيد المعلومات.'
              : 'We will verify your account once the information is confirmed.',
          confirmButtonText: this.lang === 'ar' ? 'حسناً' : 'OK',
        }).then(() => {
          this.router.navigate(['/app/profile']);
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
        this.form.get(key)?.setErrors({ serverError: messages.join(', ') });
      }
    }
  } else {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: 'An unexpected error occurred.',
    });
  }
}
}