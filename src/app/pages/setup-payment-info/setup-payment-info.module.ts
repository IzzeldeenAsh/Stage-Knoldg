import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { SetupPaymentInfoComponent } from './setup-payment-info.component';
import { ManualAccountComponent } from './manual-account/manual-account.component';
import { StripeCallbackComponent } from './stripe-callback/stripe-callback.component';
import { PaymentSuccessComponent } from './payment-success/payment-success.component';
import { PaymentHeaderComponent } from '../../reusable-components/payment-header/payment-header.component';

@NgModule({
  declarations: [
    SetupPaymentInfoComponent,
    ManualAccountComponent,
    StripeCallbackComponent,
    PaymentSuccessComponent,
    PaymentHeaderComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forChild([
      {
        path: '',
        component: SetupPaymentInfoComponent
      },
      {
        path: 'manual-account',
        component: ManualAccountComponent
      },
      {
        path: 'stripe-callback',
        component: StripeCallbackComponent
      },
      {
        path: 'success',
        component: PaymentSuccessComponent
      }
    ])
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SetupPaymentInfoModule { }