import { Component, Input } from '@angular/core';
import { ICreateKnowldege } from '../../create-account.helper';
import { Router } from '@angular/router';

@Component({
  selector: 'app-step6',
  templateUrl: './step6.component.html'
})
export class Step6Component {

  constructor(private router: Router) {}

  navigateToStepper() {
    console.log('Navigating to stepper...');
    // Try with the full absolute path
    window.location.reload();
  }
  
  @Input() defaultValues: Partial<ICreateKnowldege>;
} 