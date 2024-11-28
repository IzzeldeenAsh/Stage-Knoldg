// base.component.ts
import { OnDestroy, AfterViewInit, Directive } from '@angular/core';
import { Subscription } from 'rxjs';
import { ScrollAnimsService } from '../_fake/services/scroll-anims/scroll-anims.service';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';

@Directive()
export abstract class BaseComponent implements OnDestroy, AfterViewInit {
  protected unsubscribe: Subscription[] = [];
  dir:string;
  constructor(
    protected scrollAnims: ScrollAnimsService,
    public messageService: MessageService // Inject MessageService
  ) {
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.scrollAnims.scrollAnimations();
    }, 100);
  }
  showInfo(detail: string) {
    this.messageService.add({ severity: 'info', summary: 'Info', detail });
  }
  showWarn(detail: string) {
    this.messageService.add({ severity: 'warn', summary: 'Warning', detail });
  }
  showSuccess(detail: string) {
    this.messageService.add({ severity: 'success', summary: 'Success', detail, life: 5000 }); // 5 seconds
  }
  showError(detail: string) {
    this.messageService.add({ severity: 'error', summary: 'Error', detail });
  }
  ngOnDestroy(): void {
    console.log("Subs Destroyed");
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
