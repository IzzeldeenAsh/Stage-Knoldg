// base.component.ts
import { OnDestroy, AfterViewInit, Directive, Injector } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { ScrollAnimsService } from '../_fake/services/scroll-anims/scroll-anims.service';
import { MessageService } from 'primeng/api';
import { TranslationService } from 'src/app/modules/i18n';
import { ToastService } from '../_fake/services/toast-service/toast.service';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Directive()
export abstract class BaseComponent implements OnDestroy, AfterViewInit {
  protected scrollAnims: ScrollAnimsService;
  public messageService: MessageService;
  protected translate: TranslationService;
  public toastService: ToastService;
   unsubscribe$ = new Subject<void>();
  protected unsubscribe: Subscription[] = [];
  lang: string='en';
  clientBaseUrl = 'https://knoldg.com';
  

  constructor(protected injector: Injector) {
    this.scrollAnims = this.injector.get(ScrollAnimsService);
    this.messageService = this.injector.get(MessageService);
    this.translate = this.injector.get(TranslationService);
    this.lang = this.translate.getSelectedLanguage();
    this.toastService = this.injector.get(ToastService);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.scrollAnims.scrollAnimations();
    }, 100);
  }

  showInfo(summary:string ='Info',detail: string='Info' ) {
    this.toastService.info(detail, summary);
  }

  showWarn(summary:string ='Warning',detail: string='Warning' ) {
    this.toastService.warning(detail, summary);
  }

  showSuccess(summary:string ='Success',detail: string='Success' ) {
    this.toastService.success(detail, summary);
  }

  showError(summary:string ='Error',detail: string='Error' ,life:number=5000) {
    this.toastService.error(detail, summary, life);
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
