import { Component, Injector, OnInit } from '@angular/core';
import { ToastService } from 'src/app/_fake/services/toast-service/toast.service';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-wizards',
  templateUrl: './wizards.component.html',
})
export class WizardsComponent extends BaseComponent implements OnInit {
  constructor(injector: Injector , ) {
    super(injector);
  }

  ngOnInit(): void {

}
}
