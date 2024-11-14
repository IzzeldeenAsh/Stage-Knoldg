import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main.component';
import { ResultsPageComponent } from './results-page/results-page.component';

const routes: Routes = [
  {
    path: '',
    component: MainComponent,
    children:[
      {
        path:'',
        redirectTo:'results',
        pathMatch:'full'
      },
      {
        path:'results',
        component:ResultsPageComponent
      }
    ]
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainPageRoutingModule { }
