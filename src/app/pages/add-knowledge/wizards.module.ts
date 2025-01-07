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
import { TranslationModule } from 'src/app/modules/i18n';
import { InputTextModule } from 'primeng/inputtext';
import { EditorModule } from '@tinymce/tinymce-angular';
import { DropdownModule } from 'primeng/dropdown';
import { IndustrySelectorComponent } from 'src/app/reusable-components/industry-selector/industry-selector.component';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SelectEconomicBlockComponent } from 'src/app/reusable-components/select-economic-block/select-economic-block.component';
import { SelectRegionComponent } from 'src/app/reusable-components/select-region/select-region.component';
import { GetHsCodeByIsicComponent } from 'src/app/reusable-components/get-hs-code-by-isic/get-hs-code-by-isic.component';
import { ToastModule } from 'primeng/toast';
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
    TranslationModule,
    IndustrySelectorComponent,
    InputTextModule,
    NgbTooltipModule,
    SelectEconomicBlockComponent,
    GetHsCodeByIsicComponent,
    SharedModule,
    DropdownModule,
    SelectRegionComponent,
    SelectButtonModule,
    ToastModule
  ],
})
export class WizardsModule {}
