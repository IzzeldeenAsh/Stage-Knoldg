import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ClipboardModule } from 'ngx-clipboard';
import { TranslateModule } from '@ngx-translate/core';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthService } from './modules/auth/services/auth.service';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { AuthInterceptor } from './modules/auth/interceptor-auth.interceptor';
import { MessageService, PrimeNGConfig } from 'primeng/api';
import { ApplicationConfig } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { RippleModule } from 'primeng/ripple';
import Aura from '@primeng/themes/aura';

function appInitializer(authService: AuthService) {
  return () => {
    return new Promise((resolve) => {
      //@ts-ignore
      authService.getUserByToken().subscribe().add(resolve);
      //tets
    });
  };
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    TranslateModule.forRoot(),
    HttpClientModule,
    ClipboardModule,
    InlineSVGModule.forRoot(),
    NgbModule,
    SweetAlert2Module.forRoot(),
    RippleModule
  ],
  providers: [
    MessageService,
    PrimeNGConfig,
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializer,
      multi: true,
      deps: [AuthService],
    },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    provideClientHydration(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule { 
  constructor(private primengConfig: PrimeNGConfig) {
    this.primengConfig.ripple = true;
  }
}
