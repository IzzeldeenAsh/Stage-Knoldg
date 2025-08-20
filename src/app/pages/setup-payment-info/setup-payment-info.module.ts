import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DialogModule } from 'primeng/dialog';

import { SetupPaymentInfoComponent } from './setup-payment-info.component';
import { ManualAccountComponent } from './manual-account/manual-account.component';
import { StripeCallbackComponent } from './stripe-callback/stripe-callback.component';
import { PaymentSuccessComponent } from './payment-success/payment-success.component';
import { PaymentHeaderComponent } from '../../reusable-components/payment-header/payment-header.component';
import { PaymentTypeGuard } from './guards/payment-type.guard';
import { PhoneNumberInputModule } from '../../reusable-components/phone-number-input/phone-number-input.module';
import { ToastModule } from 'primeng/toast';
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
    ToastModule,
    DialogModule,
    PhoneNumberInputModule,
    RouterModule.forChild([
      {
        path: '',
        component: SetupPaymentInfoComponent
      },
      {
        path: 'manual-account',
        component: ManualAccountComponent,
        canActivate: [PaymentTypeGuard]
      },
      {
        path: 'stripe-callback',
        component: StripeCallbackComponent,
        canActivate: [PaymentTypeGuard]
      },
      {
        path: 'stripe-callback/return',
        component: StripeCallbackComponent,
        canActivate: [PaymentTypeGuard],
        data: { action: 'return' }
      },
      {
        path: 'stripe-callback/refresh',
        component: StripeCallbackComponent,
        canActivate: [PaymentTypeGuard],
        data: { action: 'refresh' }
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