import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AuthRoutingModule } from './auth-routing.module';
import { LoginComponent } from './components/login/login.component';
import { RegistrationComponent } from './components/registration/registration.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { LogoutComponent } from './components/logout/logout.component';
import { AuthComponent } from './auth.component';
import { TranslationModule } from '../i18n/translation.module';
import { LanguageSwitchModule } from 'src/app/reusable-components/language-switch/language-switch.module';
import { VerficationCardComponent } from './components/verfication-card/verfication-card.component';
import { DropdownModule } from 'primeng/dropdown';
import { ProgressBarModule } from 'primeng/progressbar';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { WaitComponent } from './components/wait/wait.component';
import { MessagesModule } from 'primeng/messages';

@NgModule({
  declarations: [
    LoginComponent,
    RegistrationComponent,
    ForgotPasswordComponent,
    VerficationCardComponent,
    LogoutComponent,
    WaitComponent,
    AuthComponent,
  ],
  imports: [
    CommonModule,
    TranslationModule,
    MessagesModule,
    SweetAlert2Module.forChild(),
    AuthRoutingModule,
    ProgressBarModule,
    LanguageSwitchModule,
    FormsModule,
    ReactiveFormsModule,
    DropdownModule,
    HttpClientModule,
  ],
})
export class AuthModule {}
