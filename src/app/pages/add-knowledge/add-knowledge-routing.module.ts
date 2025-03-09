import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddKnowledgeComponent } from './add-knowledge/add-knowledge.component';
import { HorizontalComponent } from './add-knowledge/horizontal/horizontal.component';

const routes: Routes = [
  {
    path: '',
    component: AddKnowledgeComponent,
    children: [
      {
        path: 'stepper',
        component: HorizontalComponent,
      },
      {
        path: 'stepper/:id',
        component: HorizontalComponent,
      },
      { path: '', redirectTo: 'stepper', pathMatch: 'full' },
      { path: '**', redirectTo: 'stepper', pathMatch: 'full' },
    ],
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AddKnowledgeRoutingModule { }
