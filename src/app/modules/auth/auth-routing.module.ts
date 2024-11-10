import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthComponent } from './auth.component';
import { LoginComponent } from './components/login/login.component';
import { RegistrationComponent } from './components/registration/registration.component';

import { LogoutComponent } from './components/logout/logout.component';
import { VerficationCardComponent } from './components/verfication-card/verfication-card.component';
import { WaitComponent } from './components/wait/wait.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { PasswordResetComponent } from './components/password-reset/password-reset.component';
import { VerifyEmailComponent } from './components/verify-email/verify-email.component';
import { CallbackComponent } from './components/callback/callback.component';

const routes: Routes = [
  {
    path: '',
    component: AuthComponent,
    children: [
      {
        path: '',
        redirectTo: 'registration', // Only one redirection to 'login'
        pathMatch: 'full',
      },
      {
        path: 'login',
        component: LoginComponent,
        data: { returnUrl: window.location.pathname },
      },
      {
        path:'verify-email',
        component:VerifyEmailComponent,
      },
      {
        path: 'password-reset',
        component: PasswordResetComponent,
      },
      {
        path: 'callback',
        component: CallbackComponent,
      },

      {
        path: 'registration',
        component: RegistrationComponent,
      },
      {
        path: 'verify-email/:email',
        component: VerficationCardComponent,
      },
      {
        path: 'wait',
        component: WaitComponent,
      },
     
      {
        path: 'sign-up',
        component: SignUpComponent,
      },
      {
        path: 'logout',
        component: LogoutComponent,
      },
      { path: '**', redirectTo: 'login', pathMatch: 'full' }, // Catch-all redirection to 'login'
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AuthRoutingModule {}
