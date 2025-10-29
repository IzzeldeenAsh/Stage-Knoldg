import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedTreeSelectorComponent } from 'src/app/reusable-components/shared-tree-selector/shared-tree-selector.component';
import { CountryDropdownComponent } from 'src/app/reusable-components/country-dropdown/country-dropdown.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslationModule } from 'src/app/modules/i18n';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TooltipModule } from 'primeng/tooltip';
import { DropdownModule } from 'primeng/dropdown';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { TruncateTextPipe } from 'src/app/pipes/truncate-pipe/truncate-text.pipe';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    SharedTreeSelectorComponent,
    CountryDropdownComponent,
    TranslationModule,
    FormsModule,
    ReactiveFormsModule,
    TooltipModule,
    DropdownModule,
    DialogModule,
    CheckboxModule,
    TruncateTextPipe
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UpgradeToCompanyModule { } 