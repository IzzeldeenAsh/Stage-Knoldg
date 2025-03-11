import { Component, Input } from '@angular/core';
import { ICreateKnowldege } from '../../create-account.helper';

@Component({
  selector: 'app-step6',
  templateUrl: './step6.component.html'
})
export class Step6Component {
  constructor() {}
  
  @Input() defaultValues: Partial<ICreateKnowldege>;
} 