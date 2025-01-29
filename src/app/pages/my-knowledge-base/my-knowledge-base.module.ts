import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MyKnowledgeBaseRoutingModule } from "./my-knowledge-base-routing.module";
import { ViewMyKnowledgeComponent } from "./view-my-knowledge/view-my-knowledge.component";
import { KnowledgeDetailsComponent } from "./view-my-knowledge/knowledge-details/knowledge-details.component";
import { KnowledgeAnalyticsComponent } from "./view-my-knowledge/knowledge-analytics/knowledge-analytics.component";
import { SharedModule } from "src/app/_metronic/shared/shared.module";
import { TranslationModule } from "src/app/modules/i18n";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { MenuModule } from "primeng/menu";
import { SchedulePublishDialogComponent } from "./view-my-knowledge/schedule-publish-dialog/schedule-publish-dialog.component";
import { CalendarModule } from "primeng/calendar";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { DynamicDialogModule } from "primeng/dynamicdialog";
import { InputTextModule } from "primeng/inputtext";
import { DropdownModule } from "primeng/dropdown";
import { TreeModule } from "primeng/tree";
import { EditorModule } from "@tinymce/tinymce-angular";
import { ReactiveFormsModule } from "@angular/forms";
import { ToastModule } from "primeng/toast";
import { FileSizePipe } from "src/app/reusable-components/file-uploader/file-size.pipe";
import { SelectRegionComponent } from "src/app/reusable-components/select-region/select-region.component";
import { SelectEconomicBlockComponent } from "src/app/reusable-components/select-economic-block/select-economic-block.component";

@NgModule({
  declarations: [
    ViewMyKnowledgeComponent,
    KnowledgeDetailsComponent,
    KnowledgeAnalyticsComponent,
    SchedulePublishDialogComponent,
  ],
  imports: [
    CommonModule,
    MyKnowledgeBaseRoutingModule,
    SharedModule,
    TranslationModule,
    NgbModule,
    MenuModule,
    CalendarModule,
    ButtonModule,
    DialogModule,
    DynamicDialogModule,
    InputTextModule,
    DropdownModule,
    TreeModule,
    EditorModule,
    ReactiveFormsModule,
    ToastModule,
    FileSizePipe,
    SelectRegionComponent,
    SelectEconomicBlockComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MyKnowledgeBaseModule { }
