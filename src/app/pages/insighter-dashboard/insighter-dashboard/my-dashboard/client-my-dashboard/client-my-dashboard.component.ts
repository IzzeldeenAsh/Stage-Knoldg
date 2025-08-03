import { Component, Injector } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-client-my-dashboard',
  templateUrl: './client-my-dashboard.component.html',
  styleUrl: './client-my-dashboard.component.scss'
})
export class ClientMyDashboardComponent extends BaseComponent {
  constructor(injector:Injector){
    super(injector)
  }

}
