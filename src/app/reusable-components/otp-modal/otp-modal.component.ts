import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { TranslationService } from 'src/app/modules/i18n';

export interface OtpModalConfig {
  headerTitle?: string;
  redirectMessage?: string;
  autoGenerateOnOpen?: boolean;
}

@Component({
  selector: 'app-otp-modal',
  templateUrl: './otp-modal.component.html',
  styleUrls: ['./otp-modal.component.scss']
})
export class OtpModalComponent implements OnInit, OnDestroy {
  @Input() visible: boolean = false;
  @Input() config: OtpModalConfig = {};
  @Input() isSubmitting: boolean = false;
  @Input() isWaitingForRedirect: boolean = false;
  @Input() isResending: boolean = false;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() otpSubmit = new EventEmitter<string>();
  @Output() otpResend = new EventEmitter<void>();
  @Output() modalCancel = new EventEmitter<void>();
  @Output() modalClose = new EventEmitter<void>();

  otpCode: string = '';
  resendCooldown: number = 0;
  canResend: boolean = true;
  lang: string = 'en';
  private cooldownTimer: any;

  constructor(private translationService: TranslationService) {}

  ngOnInit() {
    this.translationService.onLanguageChange().subscribe(lang => {
      this.lang = lang || 'en';
    });
  }

  ngOnDestroy() {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }
  }

  get headerTitle(): string {
    if (this.config.headerTitle) {
      return this.config.headerTitle;
    }
    return this.lang === 'ar' ? 'تحقق من هويتك' : 'Verify Your Identity';
  }

  get redirectMessage(): string {
    if (this.config.redirectMessage) {
      return this.config.redirectMessage;
    }
    return this.lang === 'ar' ? 'جاري المعالجة...' : 'Processing...';
  }

  onSubmit() {
    if (this.otpCode.trim()) {
      this.otpSubmit.emit(this.otpCode.trim());
    }
  }

  onResendOtp() {
    if (this.canResend) {
      this.otpResend.emit();
      this.startCooldown();
    }
  }

  onCancel() {
    this.modalCancel.emit();
    this.closeModal();
  }

  onClose() {
    this.modalClose.emit();
    this.closeModal();
  }

  private closeModal() {
    this.visible = false;
    this.visibleChange.emit(false);
    this.otpCode = '';
    this.resetCooldown();
  }

  private startCooldown() {
    this.canResend = false;
    this.resendCooldown = 30;

    this.cooldownTimer = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        this.canResend = true;
        clearInterval(this.cooldownTimer);
        this.cooldownTimer = null;
      }
    }, 1000);
  }

  private resetCooldown() {
    this.canResend = true;
    this.resendCooldown = 0;
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }

  // Public methods for external control
  public showModal() {
    this.visible = true;
    this.visibleChange.emit(true);
    if (this.config.autoGenerateOnOpen) {
      // Small delay to allow modal to open first
      setTimeout(() => {
        this.onResendOtp();
      }, 100);
    }
  }

  public hideModal() {
    this.closeModal();
  }

  public clearOtp() {
    this.otpCode = '';
  }
}