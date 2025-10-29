import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PrimengHeaderComponent } from './primeng-header.component';
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { SidebarModule } from 'primeng/sidebar';
import { AvatarModule } from 'primeng/avatar';
import { MenuModule } from 'primeng/menu';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { RippleModule } from 'primeng/ripple';
import { TranslationModule } from 'src/app/modules/i18n';
import { ExtrasModule } from '../../../partials/layout/extras/extras.module';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { LayoutModule } from '@angular/cdk/layout';
import { LanguageSwitchModule } from 'src/app/reusable-components/language-switch/language-switch.module';

@NgModule({
  declarations: [
    PrimengHeaderComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    MenubarModule,
    ButtonModule,
    SidebarModule,
    AvatarModule,
    SharedModule,
    MenuModule,
    InlineSVGModule,
    RippleModule,
    TranslationModule,
    ExtrasModule,
    LayoutModule,
    LanguageSwitchModule
  ],
  exports: [
    PrimengHeaderComponent
  ]
})
export class PrimengHeaderModule { }
