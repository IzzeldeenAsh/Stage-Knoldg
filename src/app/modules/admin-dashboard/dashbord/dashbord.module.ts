import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressBarModule } from 'primeng/progressbar';
import { DashbordRoutingModule } from './dashbord-routing.module';
import { DashboardComponent } from './dashboard/dashboard.component';
import { CompanySettingsComponent } from './company-settings/company-settings.component';
import { DashboardStatsBarComponent } from './dashboard/dashboard-stats-bar/dashboard-stats-bar.component';
import { AdminNotificationsComponent } from './dashboard/admin-notifications/admin-notifications.component';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { DepartmentComponent } from './dashboard/departments/departments.component';
import { TableModule } from 'primeng/table';
import { AccordionModule } from 'primeng/accordion';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TreeSelectModule } from 'primeng/treeselect';
import { MessagesModule } from 'primeng/messages';
import { EditorModule } from '@tinymce/tinymce-angular';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TooltipModule } from 'primeng/tooltip';
import { PositionsComponent } from './dashboard/positions/positions.component';
import { CountriesComponent } from './dashboard/countries/countries.component';
import { RegionsComponent } from './dashboard/regions/regions.component';
import { DropdownModule } from 'primeng/dropdown';
import { ConsultingFieldsComponent } from './dashboard/consulting-fields/consulting-fields.component';
import { ToastModule } from 'primeng/toast';
import { TreeTableModule } from 'primeng/treetable';
import { MessageModule } from 'primeng/message';
import { ISICCodeManagmentComponent } from './dashboard/isic-code-managment/isic-code-managment.component';
import { NodeService } from 'src/app/_fake/services/nodeService/nodeservice';
import { TagsComponent } from './dashboard/tags/tags.component';
import { HSCodeComponent } from './hscode/hscode.component';
import { GuidelineComponent } from './dashboard/guidelines/guidelines.component';
import { ChipModule } from 'primeng/chip';
import { TreeModule } from 'primeng/tree';
import { TopicsComponent } from './dashboard/topics/topics.component';
import { IndustriesComponent } from './dashboard/industries/industries.component';
import { RequestsListComponent } from './dashboard/requests-list/requests-list.component';
import { EconomicBlocksComponent } from './dashboard/economic-blocks/economic-blocks.component';
import { VerificationQuestionsListComponent } from './dashboard/verification-questions-list/verification-questions-list.component';
import { AdminNotificationsPageComponent } from './dashboard/admin-notifications-page/admin-notifications-page.component';
import { NotificationsIconsPipe } from 'src/app/pipes/notifications-icons/notificaitons-icons.pipe';
import { NotificationsBgPipe } from 'src/app/pipes/notifications-background/notifications-bg.pipe';
import { TagInputModule } from 'ngx-chips';
import { MultiSelectModule } from 'primeng/multiselect';
import { PaginatorModule } from 'primeng/paginator';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@NgModule({
  declarations: [
    DashboardComponent,
    CompanySettingsComponent,
    DashboardStatsBarComponent,
    AdminNotificationsComponent,
    CountriesComponent,
    DepartmentComponent,
    TopicsComponent,
    ConsultingFieldsComponent,
    TagsComponent,
    HSCodeComponent,
    RequestsListComponent,
    VerificationQuestionsListComponent,
    AdminNotificationsPageComponent,
    ISICCodeManagmentComponent,
    RegionsComponent,
    IndustriesComponent,
    GuidelineComponent,
    PositionsComponent,
    EconomicBlocksComponent,
  ],
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    TooltipModule,
    ProgressBarModule,
    DashbordRoutingModule,
    InlineSVGModule,
    DropdownModule,
    EditorModule,
    InputTextModule,
    FormsModule,
    TreeSelectModule,
    TreeTableModule,
    TreeModule,
    ReactiveFormsModule,
    CardModule,
    AccordionModule,
    ToastModule,
    MessageModule,
    MessagesModule,
    TableModule,
    ChipModule,
    TagInputModule,
    MultiSelectModule,
    PaginatorModule,
    ProgressSpinnerModule,
    NotificationsIconsPipe,
    NotificationsBgPipe,
  ],
  providers: [NodeService]
})
export class DashbordModule { }
