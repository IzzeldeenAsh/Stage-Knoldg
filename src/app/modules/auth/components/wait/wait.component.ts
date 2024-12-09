import { Component, Injector } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-wait',
  templateUrl: './wait.component.html',
  styleUrl: './wait.component.scss'
})
export class WaitComponent extends BaseComponent {
constructor(injector: Injector
) {
  super(injector);
}}
