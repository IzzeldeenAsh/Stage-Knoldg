import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileComponent } from './profile.component';
import { OverviewComponent } from './profile-pages/overview/overview.component';
import { CompanyComponent } from './profile-pages/company/company.component';
import { CertificatesComponent } from './profile-pages/certificates/certificates.component';
import { CompanyCertificatesComponent } from './profile-pages/company-certificates/company-certificates.component';
import { RolesGuard } from 'src/app/guards/roles-guard/roles-gurad.gurad';
import { DocumentsComponent } from './profile-pages/documents/documents.component';
import { SettingsDashboardComponent } from './profile-pages/account-settings/settings-dashboard/settings-dashboard.component';
import { PersonalSettingsComponent } from './profile-pages/account-settings/personal-settings/personal-settings.component';
import { CompanySettingsComponent } from './profile-pages/account-settings/company-settings/company-settings.component';
import { ResetPasswordComponent } from './profile-pages/account-settings/reset-password/reset-password.component';
import { authGuard } from 'src/app/guards/auth-guard/auth.guard';
import { JoinCompanyComponent } from './profile-pages/join-company/join-company.component';

const routes: Routes = [
  {
    path:'',
   component:ProfileComponent,
   children:[
    {
      path:'',
      redirectTo:'overview',
      pathMatch:'full'
    },
    {
      path:'overview',
      component:OverviewComponent
    },
    {
      path:'company',
      component:CompanyComponent,
      canActivate:[RolesGuard],
      data: { roles: ['company'] }
    },
    {
      path:'documents',
      component:DocumentsComponent,
      canActivate:[RolesGuard],
      data: { roles: [ 'company'] } 
    },
   
    {
      path:'certificates',
      component:CertificatesComponent,
      canActivate:[RolesGuard],
      data: { roles: ['insighter', 'company', 'company-insighter'] } 
    },
    {
      path:'company-certificates',
      component:CompanyCertificatesComponent,
      canActivate:[RolesGuard],
      data: { roles: ['company'] } 
    },
    // Old settings path kept for backward compatibility
    {
      path: 'settings',
      component: SettingsDashboardComponent,
      canActivate: [authGuard],
      children:[
        {
          path:'',
          redirectTo:'personal-info',
          pathMatch:'full'
        },
        {
          path:'personal-info',
          component:PersonalSettingsComponent
        },
        {
          path:'company-settings',
          component:CompanySettingsComponent,
          canActivate:[RolesGuard],
          data: { roles: ['company', 'company-insighter'] } 
        },
        {
          path:'reset-password',
          component:ResetPasswordComponent,
          canActivate:[RolesGuard],
          data: { roles: ['client'] } 
        },
        {
          path:'company-account',
          component:CompanySettingsComponent,
          canActivate:[RolesGuard],
          data: { roles: ['company'] } 
        }
      ],
      data: { roles: ['insighter', 'company', 'client'] } 
    },
    // Direct access to settings pages
    {
      path: 'settings/personal-info',
      component: PersonalSettingsComponent,
      canActivate: [authGuard, RolesGuard],
      data: { roles: ['company', 'insighter', 'client'] }
    },
    {
      path: 'settings/company-settings',
      component: CompanySettingsComponent,
      canActivate: [authGuard, RolesGuard],
      data: { roles: ['company', 'company-insighter'] }
    },
    {
      path: 'settings/reset-password',
      component: ResetPasswordComponent,
      canActivate: [authGuard, RolesGuard],
      data: { roles: ['client'] }
    },
   ]
  },
 {
  path:'join-company',
  component:JoinCompanyComponent,
  canActivate:[RolesGuard],
  data: { roles: ['client'] }
 }
 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserProfileRoutingModule { }
