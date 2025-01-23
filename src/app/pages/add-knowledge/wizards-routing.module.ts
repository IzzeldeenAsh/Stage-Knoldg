import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HorizontalComponent } from './horizontal/horizontal.component';
import { WizardsComponent } from './wizards.component';

const routes: Routes = [
  {
    path: '',
    component: WizardsComponent,
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
  exports: [RouterModule],
})
export class WizardsRoutingModule {}
