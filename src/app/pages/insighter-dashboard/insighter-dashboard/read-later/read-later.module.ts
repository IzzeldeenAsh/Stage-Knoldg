import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReadLaterRoutingModule } from './read-later-routing.module';
import { ReadLaterComponent } from './read-later.component';
import { TranslationModule } from 'src/app/modules/i18n';
import { TruncateTextPipe } from 'src/app/pipes/truncate-pipe/truncate-text.pipe';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';

@NgModule({
  declarations: [
    ReadLaterComponent
  ],
  imports: [
    CommonModule,
    ReadLaterRoutingModule,
    TranslationModule,
    ButtonModule,
    TruncateTextPipe,
    TooltipModule
  ]
})
export class ReadLaterModule { }