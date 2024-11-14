import { Routes } from '@angular/router';

const Routing: Routes = [
  {
    path: '',
    redirectTo: 'results-home',
    pathMatch: 'full',
  },
  {
    path: 'results-home',
    loadChildren: () => import('./main-page/main-page.module').then((m) => m.MainPageModule),
  },
  {
    path: 'insighter-register',
    loadChildren: () => import('./wizards/wizards.module').then((m) => m.WizardsModule),
  },
  {
    path: '**',
    redirectTo: 'error/404',
  },
];

export { Routing };
