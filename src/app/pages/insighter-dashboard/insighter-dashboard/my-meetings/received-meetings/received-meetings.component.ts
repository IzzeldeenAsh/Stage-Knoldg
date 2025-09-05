import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { TranslationModule } from 'src/app/modules/i18n';
import { TruncateTextPipe } from 'src/app/pipes/truncate-pipe/truncate-text.pipe';
import { MyMeetingsComponent } from '../my-meetings.component';

@Component({
  selector: 'app-received-meetings',
  templateUrl: './received-meetings.component.html',
  styleUrls: ['./received-meetings.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    TooltipModule,
    InputTextareaModule,
    TranslationModule,
    TruncateTextPipe,
    MyMeetingsComponent
  ]
})
export class ReceivedMeetingsComponent {}