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
  clientBaseUrl = 'https://knowrland-for-client.vercel.app';
  

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

  showInfo(summary:string ='Info',detail: string) {
    this.messageService.add({ severity: 'info', summary, detail });
  }

  showWarn(summary:string ='Warning',detail: string) {
    this.messageService.add({ severity: 'warn', summary, detail });
  }

  showSuccess(summary:string ='Success',detail: string) {
    this.messageService.add({ severity: 'success', summary, detail, life: 5000 }); // 5 seconds
  }

  showError(summary:string ='Error',detail: string ,life:number=5000) {
    this.messageService.add({ severity: 'error', summary, detail, life });
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }
}
