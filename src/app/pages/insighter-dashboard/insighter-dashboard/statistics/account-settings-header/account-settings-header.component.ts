import { Component, Injector } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-account-settings-header',
  templateUrl: './account-settings-header.component.html',
  styleUrl: './account-settings-header.component.scss'
})
export class AccountSettingsHeaderComponent extends BaseComponent  {
  constructor(injector: Injector){
    super(injector);
  }

}
