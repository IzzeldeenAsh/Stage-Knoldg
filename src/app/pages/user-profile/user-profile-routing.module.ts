import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileComponent } from './profile.component';
import { AuthGuard } from 'src/app/guards/auth-guard/auth.guard';
import { OverviewComponent } from './profile-pages/overview/overview.component';
import { CertificatesComponent } from './profile-pages/certificates/certificates.component';
import { RolesGuard } from 'src/app/guards/roles-guard/roles-gurad.gurad';
import { DocumentsComponent } from './profile-pages/documents/documents.component';
import { UpgradeToCompanyComponent } from './profile-pages/account-settings/upgrade-to-company/upgrade-to-company.component';
import { SettingsDashboardComponent } from './profile-pages/account-settings/settings-dashboard/settings-dashboard.component';
import { ResetPasswordComponent } from './profile-pages/account-settings/reset-password/reset-password.component';
import { PersonalSettingsComponent } from './profile-pages/account-settings/personal-settings/personal-settings.component';
import { CompanySettingsComponent } from './profile-pages/account-settings/company-settings/company-settings.component';
import { SettingsActionComponent } from './profile-pages/account-settings/settings-action/settings-action.component';
import { UserRequestsComponent } from './profile-pages/user-requests/user-requests.component';

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
      path:'documents',
      component:DocumentsComponent,
      canActivate:[RolesGuard],
      data: { roles: [ 'company'] } 
    },
    {
      path:'user-requests',
      component:UserRequestsComponent,
      canActivate:[RolesGuard],
      data: { roles: ['insighter', 'company'] } 
    },
    {
      path:'certificates',
      component:CertificatesComponent,
      canActivate:[RolesGuard],
      data: { roles: ['insighter', 'company'] } 
    },
    {
      path: 'settings',
      component: SettingsDashboardComponent,
      canActivate: [AuthGuard], // Apply guards here
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
          component:CompanySettingsComponent
        },
        {
          path:'reset-password',
          component:ResetPasswordComponent
        },
        {
          path:'company-account',
          component:CompanySettingsComponent
        },
        {
          path:'settings-action',
          component:SettingsActionComponent
        }
      ],
      data: { roles: ['insighter', 'company'] } 
    },
    {
      path:'company-account',
      component:UpgradeToCompanyComponent,
      canActivate:[RolesGuard],
      data: { roles: ['insighter'] } 
    },
   ]
  },
 
 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserProfileRoutingModule { }
