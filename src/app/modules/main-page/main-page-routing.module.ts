import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeSearchEngineComponent } from './home-search-engine/home-search-engine.component';

const routes: Routes = [
  {
    path:'',
    redirectTo:'main',
    pathMatch:"full"
  },
  {
    path:'main',
    component:HomeSearchEngineComponent,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainPageRoutingModule { }
