import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileComponent } from './profile.component';
import { OverviewComponent } from './profile-pages/overview/overview.component';
import { CertificatesComponent } from './profile-pages/certificates/certificates.component';
import { RolesGuard } from 'src/app/guards/roles-guard/roles-gurad.gurad';
import { DocumentsComponent } from './profile-pages/documents/documents.component';
import { SettingsDashboardComponent } from './profile-pages/account-settings/settings-dashboard/settings-dashboard.component';
import { PersonalSettingsComponent } from './profile-pages/account-settings/personal-settings/personal-settings.component';
import { CompanySettingsComponent } from './profile-pages/account-settings/company-settings/company-settings.component';
import { authGuard } from 'src/app/guards/auth-guard/auth.guard';

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
      path:'certificates',
      component:CertificatesComponent,
      canActivate:[RolesGuard],
      data: { roles: ['insighter', 'company'] } 
    },
    {
      path: 'settings',
      component: SettingsDashboardComponent,
      canActivate: [authGuard], // Apply guards here
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
          data: { roles: ['company'] } 
        },
        
        {
          path:'company-account',
          component:CompanySettingsComponent,
          canActivate:[RolesGuard],
          data: { roles: ['company'] } 
        }
       
      ],
      data: { roles: ['insighter', 'company'] } 
    },
   
   ]
  },
 
 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserProfileRoutingModule { }
