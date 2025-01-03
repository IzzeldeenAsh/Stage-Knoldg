import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { MyKnowledgeComponent } from './my-knowledge.component';
import { TranslationModule } from 'src/app/modules/i18n';
import { KnowledgeHeaderComponent } from './components/knowledge-header/knowledge-header.component';
import { GeneralComponent } from './components/general/general.component';
import { ScheduledComponent } from './components/scheduled/scheduled.component';
import { PostedComponent } from './components/posted/posted.component';
import { PackagesComponent } from './components/packages/packages.component';

const routes: Routes = [
  {
    path: '',
    component: MyKnowledgeComponent,
    children: [
      {
        path: '',
        redirectTo: 'general',
        pathMatch: 'full'
      },
      {
        path: 'general',
        component: GeneralComponent
      },
      {
        path: 'scheduled',
        component: ScheduledComponent
      },
      {
        path: 'posted',
        component: PostedComponent
      },
      {
        path: 'packages',
        component: PackagesComponent
      }
    ]
  }
];

@NgModule({
  declarations: [
    MyKnowledgeComponent,
    KnowledgeHeaderComponent,
    GeneralComponent,
    ScheduledComponent,
    PostedComponent,
    PackagesComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    TranslationModule
  ]
})
export class MyKnowledgeModule { } 