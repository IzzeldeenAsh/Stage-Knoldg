import { Component, Injector } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-company-my-dashboard',
  templateUrl: './company-my-dashboard.component.html',
  styleUrl: './company-my-dashboard.component.scss'
})
export class CompanyMyDashboardComponent extends BaseComponent {
  constructor(injector :Injector){
    super(injector);
  }
    showDonutChart = false;
    showEmployeeStats = false;
    onHasMultipleEmployees($event: boolean) {
    this.showEmployeeStats = $event;
    console.log('hasMultipleEmployees',$event);
  }

  onHasMultipleEmployeesDonut($event: boolean) {
    this.showDonutChart = $event;
    console.log('hasMultipleEmployeesDonut',$event);
  }
}
