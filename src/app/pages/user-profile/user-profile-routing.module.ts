import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProfileComponent } from './profile.component';
import { AuthGuard } from 'src/app/guards/auth-guard/auth.guard';
import { OverviewComponent } from './profile-pages/overview/overview.component';
import { AccountSettingsComponent } from './profile-pages/account-settings/account-settings.component';

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
      path: 'settings',
      component: AccountSettingsComponent,
      canActivate: [AuthGuard], // Apply guards here
    },
   ]
  },
 
 
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserProfileRoutingModule { }
