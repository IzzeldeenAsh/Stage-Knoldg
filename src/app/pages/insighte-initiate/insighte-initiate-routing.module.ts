import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InsightInitiateComponent } from './insight-initiate.component';

const routes: Routes = [
  {
    path: '',
    component: InsightInitiateComponent,
  
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InsighteInitiateRoutingModule { }
