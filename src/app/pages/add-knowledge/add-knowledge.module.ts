import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddKnowledgeRoutingModule } from './add-knowledge-routing.module';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { EditorModule } from '@tinymce/tinymce-angular';
import { TagInputModule } from 'ngx-chips';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { FileUploadModule } from 'primeng/fileupload';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToastModule } from 'primeng/toast';
import { TranslationModule } from 'src/app/modules/i18n';
import { TruncateTextPipe } from 'src/app/pipes/truncate-pipe/truncate-text.pipe';
import { FileSizePipe } from 'src/app/reusable-components/file-uploader/file-size.pipe';
import { FileUploaderComponent } from 'src/app/reusable-components/file-uploader/file-uploader.component';
import { GetHsCodeByIsicComponent } from 'src/app/reusable-components/get-hs-code-by-isic/get-hs-code-by-isic.component';
import { IndustrySelectorComponent } from 'src/app/reusable-components/industry-selector/industry-selector.component';
import { SelectEconomicBlockComponent } from 'src/app/reusable-components/select-economic-block/select-economic-block.component';
import { SelectRegionComponent } from 'src/app/reusable-components/select-region/select-region.component';
import { AddKnowledgeComponent } from './add-knowledge/add-knowledge.component';
import { Step1Component } from './add-knowledge/steps/step1/step1.component';
import { HorizontalComponent } from './add-knowledge/horizontal/horizontal.component';
import { SharedModule } from 'src/app/_metronic/shared/shared.module';
import { Step2Component } from './add-knowledge/steps/step2/step2.component';
import { SubStepDocumentsComponent } from './add-knowledge/steps/step2/sub-step-documents/sub-step-documents.component';
import { Step3Component } from './add-knowledge/steps/step3/step3.component';
import { Step4Component } from './add-knowledge/steps/step4/step4.component';
import { Step5Component } from './add-knowledge/steps/step5/step5.component';
import { Step6Component } from './add-knowledge/steps/step6/step6.component';
import { CalendarModule } from 'primeng/calendar';
@NgModule({
  declarations: [
    AddKnowledgeComponent,
    HorizontalComponent,
    Step1Component,
    Step2Component,
    SubStepDocumentsComponent,
    Step3Component,
    Step4Component,
    Step5Component,
    Step6Component
  ],
  imports: [
    CommonModule,
    AddKnowledgeRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    TruncateTextPipe,
    EditorModule,
    DialogModule,
    FileSizePipe,
    FormsModule,
    TranslationModule,
    FileUploaderComponent,
    IndustrySelectorComponent,
    InputTextModule,
    NgbTooltipModule,
    SelectEconomicBlockComponent,
    FileUploadModule,
    GetHsCodeByIsicComponent,
    InputNumberModule,
    TagInputModule,
    SharedModule,
    DropdownModule,
    SelectRegionComponent,
    SelectButtonModule,
    ToastModule,
    CalendarModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]  // Add this line
})
export class AddKnowledgeModule { }
