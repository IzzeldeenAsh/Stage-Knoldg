import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UsersMainComponent } from './users-main/users-main.component';
import { UsersListComponent } from './users-main/users-list/users-list.component';

const routes: Routes = [
  {
    path:'',
    redirectTo:'main-users',
    pathMatch:'full'
  },
  {
    path:'main-users',
    component:UsersMainComponent,
    children:[
      {
        path:'',
        redirectTo:'users-list',
        pathMatch:'full'
      },
      {
        path:'users-list',
        component:UsersListComponent
      }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UsersRoutingModule { }
