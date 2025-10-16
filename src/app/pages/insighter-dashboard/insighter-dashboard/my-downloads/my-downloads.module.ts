import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MyDownloadsComponent } from './my-downloads.component';
import { TranslationModule } from 'src/app/modules/i18n';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TruncateTextPipe } from 'src/app/pipes/truncate-pipe/truncate-text.pipe';
import { FileSizePipe } from 'src/app/pipes/file-size-pipe/file-size.pipe';
import { ProgressBarModule } from 'primeng/progressbar';
import { TooltipModule } from 'primeng/tooltip';
const routes: Routes = [
  {
    path: '',
    component: MyDownloadsComponent
  }
];

@NgModule({
  declarations: [
    MyDownloadsComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TranslationModule,
    InlineSVGModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    TruncateTextPipe,
    ProgressBarModule,
    FileSizePipe,
    TooltipModule
  ]
})
export class MyDownloadsModule { } 