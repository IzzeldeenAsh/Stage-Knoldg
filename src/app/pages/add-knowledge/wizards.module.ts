import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { HorizontalComponent } from './horizontal/horizontal.component';
import { WizardsRoutingModule } from './wizards-routing.module';
import { WizardsComponent } from './wizards.component';
import { Step1Component } from './steps/step1/step1.component';
import { Step2Component } from './steps/step2/step2.component';
import { Step3Component } from './steps/step3/step3.component';
import { Step4Component } from './steps/step4/step4.component';
import { Step5Component } from './steps/step5/step5.component';
import { SharedModule } from "../../_metronic/shared/shared.module";
import { TranslateModule } from '@ngx-translate/core';
import { TranslationModule } from 'src/app/modules/i18n';
import { InputTextModule } from 'primeng/inputtext';
import { EditorModule } from '@tinymce/tinymce-angular';
import { SelectModule } from 'primeng/select';
@NgModule({
  declarations: [
    HorizontalComponent,
    WizardsComponent,
    Step1Component,
    Step2Component,
    Step3Component,
    Step4Component,
    Step5Component,
  ],
  imports: [
    CommonModule,
    WizardsRoutingModule,
    ReactiveFormsModule,
    EditorModule,
    SelectModule,
    TranslationModule,
    InputTextModule,
    NgbTooltipModule,
    SharedModule
  ],
})
export class WizardsModule {}
