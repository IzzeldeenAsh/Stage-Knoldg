import { Component, Input } from '@angular/core';
import { BaseComponent } from '../../modules/base.component';

@Component({
  selector: 'app-payment-header',
  templateUrl: './payment-header.component.html',
  styleUrls: ['./payment-header.component.scss']
})
export class PaymentHeaderComponent extends BaseComponent {
  @Input() title: string = '';
  @Input() subtitle: string = '';
}