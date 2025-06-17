import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MyConsultingScheduleComponent } from './my-consulting-schedule.component';

const routes: Routes = [
  {
    path: '',
    component: MyConsultingScheduleComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MyConsultingScheduleRoutingModule { } 