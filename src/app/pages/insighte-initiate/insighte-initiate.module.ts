import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InsighteInitiateRoutingModule } from './insighte-initiate-routing.module';
import { InsightInitiateComponent } from './insight-initiate.component';
import { AppFooterComponent } from 'src/app/reusable-components/app-footer/app-footer.component';
import { Step1Component } from './wizard/step-1/step-1.component';
import { Step2Component } from './wizard/step-2/step-2.component';
import { Step3Component } from './wizard/step-3/step-3.component';
import { Step4Component } from './wizard/step-4/step-4.component';
import { Step5Component } from './wizard/step-5/step-5.component';
import { ButtonModule } from 'primeng/button'; 
import { InputTextModule } from 'primeng/inputtext';
import { StepperModule } from 'primeng/stepper';
import { StepsModule } from 'primeng/steps';
import { ReactiveFormsModule } from '@angular/forms';
import { IndustrySelectorComponent } from 'src/app/reusable-components/industry-selector/industry-selector.component';
import { DropdownModule } from 'primeng/dropdown';
import { SelectEconomicBlockComponent } from 'src/app/reusable-components/select-economic-block/select-economic-block.component';
import { AutosizeDirective } from 'src/app/reusable-components/textarea-autosize/auto-textarea-resize.directive';

@NgModule({
  declarations: [InsightInitiateComponent
, Step1Component,
Step2Component,
Step3Component,
Step4Component,
Step5Component

  ],
  imports: [
    CommonModule,
    InsighteInitiateRoutingModule,
    StepsModule,
    StepperModule,
    IndustrySelectorComponent,
    AppFooterComponent,
    SelectEconomicBlockComponent,
    ButtonModule,
    InputTextModule,
    ReactiveFormsModule,
    DropdownModule,
    AutosizeDirective
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class InsighteInitiateModule { }
