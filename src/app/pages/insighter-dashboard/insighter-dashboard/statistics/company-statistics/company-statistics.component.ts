import { Component, Injector } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-company-statistics',
  templateUrl: './company-statistics.component.html',
  styleUrls: ['./company-statistics.component.scss']
})
export class CompanyStatisticsComponent extends BaseComponent {
  constructor(injector: Injector) { 
    super(injector);
  }
}
