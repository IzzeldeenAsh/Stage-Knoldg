import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LangSwitchButtonComponent } from './lang-switch-button/lang-switch-button.component';



@NgModule({
  declarations: [LangSwitchButtonComponent],
  imports: [
    CommonModule
  ],
  exports:[LangSwitchButtonComponent]
})
export class LanguageSwitchModule { }
