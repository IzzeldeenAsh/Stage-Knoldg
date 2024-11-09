// base.component.ts
import { OnDestroy, AfterViewInit, Directive } from '@angular/core';
import { Subscription } from 'rxjs';
import { ScrollAnimsService } from '../_fake/services/scroll-anims/scroll-anims.service';
import { TranslateService } from '@ngx-translate/core';

@Directive()
export abstract class BaseComponent implements OnDestroy, AfterViewInit {
  protected unsubscribe: Subscription[] = [];
  dir:string;
  constructor(
    protected scrollAnims: ScrollAnimsService,
  ) {
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.scrollAnims.scrollAnimations();
    }, 100);
  }

  ngOnDestroy(): void {
    this.unsubscribe.forEach((sb) => sb.unsubscribe());
  }
}
