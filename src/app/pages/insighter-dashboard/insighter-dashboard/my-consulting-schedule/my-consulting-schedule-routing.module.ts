import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MyConsultingScheduleComponent } from './my-consulting-schedule.component';
import { PendingChangesGuard } from 'src/app/guards/pending-changes.guard';

const routes: Routes = [
  {
    path: '',
    component: MyConsultingScheduleComponent,
    canDeactivate: [PendingChangesGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MyConsultingScheduleRoutingModule { } 