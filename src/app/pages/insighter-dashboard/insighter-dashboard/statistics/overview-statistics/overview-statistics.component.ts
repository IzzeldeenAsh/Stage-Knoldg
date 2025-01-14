import { Component, Injector } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-overview-statistics',
  templateUrl: './overview-statistics.component.html',
  styleUrl: './overview-statistics.component.scss'
})
export class OverviewStatisticsComponent extends BaseComponent  {
  constructor(injector: Injector){
    super(injector);
  }

}
