import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {InlineSVGModule} from 'ng-inline-svg-2';
import {NotificationsInnerComponent} from './dropdown-inner/notifications-inner/notifications-inner.component';
import {QuickLinksInnerComponent} from './dropdown-inner/quick-links-inner/quick-links-inner.component';
import {UserInnerComponent} from './dropdown-inner/user-inner/user-inner.component';
import {LayoutScrollTopComponent} from './scroll-top/scroll-top.component';
import {TranslationModule} from '../../../../modules/i18n';
import {SearchResultInnerComponent} from "./dropdown-inner/search-result-inner/search-result-inner.component";
import {NgbTooltipModule} from "@ng-bootstrap/ng-bootstrap";
import {FormsModule} from "@angular/forms";
import { SharedModule } from "../../../shared/shared.module";
import { NotificationsNamesPipe } from 'src/app/pipes/notificaitons-pipe/notifications-names.pipe';
import { NotificationsLinksPipe } from 'src/app/pipes/notifications-links/notifications-links.pipe';
import { NotificationsBgPipe } from 'src/app/pipes/notifications-background/notifications-bg.pipe';
import { NotificationsIconsPipe } from 'src/app/pipes/notifications-icons/notificaitons-icons.pipe';

@NgModule({
  declarations: [
    NotificationsInnerComponent,
    QuickLinksInnerComponent,
    SearchResultInnerComponent,
    UserInnerComponent,
    LayoutScrollTopComponent,
  ],
  imports: [
    CommonModule,
    NotificationsIconsPipe,
    FormsModule,
    NotificationsNamesPipe,
    NotificationsLinksPipe,
    InlineSVGModule,
    NotificationsBgPipe,
    RouterModule,
    TranslationModule,
    NgbTooltipModule,
    SharedModule
  ],
  exports: [
    NotificationsInnerComponent,
    QuickLinksInnerComponent,
    SearchResultInnerComponent,
    UserInnerComponent,
    LayoutScrollTopComponent,
  ],
})
export class ExtrasModule {
}
