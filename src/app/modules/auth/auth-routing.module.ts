import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthComponent } from './auth.component';
import { LoginComponent } from './components/login/login.component';
import { LogoutComponent } from './components/logout/logout.component';
import { SignUpComponent } from './components/sign-up/sign-up.component';
import { PasswordResetComponent } from './components/password-reset/password-reset.component';
import { VerifyEmailComponent } from './components/verify-email/verify-email.component';
import { CallbackComponent } from './components/callback/callback.component';
import { EmailReconfirmComponent } from './components/email-reconfirm/email-reconfirm.component';
import { UnAuthGuard } from '../../guards/unauth-guard/un-auth.guard';

const routes: Routes = [
  {
    path: '',
    component: AuthComponent,
    children: [
      {
        path: '',
        redirectTo: 'login', // Only one redirection to 'login'
        pathMatch: 'full',
      },
      {
        path: 'login',
        component: LoginComponent,
        data: { returnUrl: window.location.pathname },
        canActivate:[UnAuthGuard]
      },
      {
        path:'verify-email',
        component:VerifyEmailComponent,
      },
      {
        path: 'email-reconfirm',
        component: EmailReconfirmComponent,
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
        path: 'sign-up',
        component: SignUpComponent,
        canActivate:[UnAuthGuard]
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
