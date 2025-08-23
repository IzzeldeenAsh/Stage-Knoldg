import { Component, Injector } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-payment-settings-header',
  templateUrl: './payment-settings-header.component.html',
  styleUrl: './payment-settings-header.component.scss'
})
export class PaymentSettingsHeaderComponent extends BaseComponent  {
  constructor(injector: Injector){
    super(injector);
  }

}