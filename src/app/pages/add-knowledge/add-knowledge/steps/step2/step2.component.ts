import { Component, Injector, Input } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';
import { ICreateKnowldege } from '../../create-account.helper';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-step2',
  templateUrl: './step2.component.html',
  styleUrls: ['./step2.component.scss'],
  animations: [
    trigger('fadeInMoveY', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(-20px)' }))
      ])
    ])
  ]
})
export class Step2Component extends BaseComponent {
  @Input('updateParentModel') updateParentModel: (
    part: Partial<ICreateKnowldege>,
    isFormValid: boolean
  ) => void;

  @Input() defaultValues: Partial<ICreateKnowldege>;
  @Input() knowledgeId!: number;

  constructor(injector: Injector) {
    super(injector);
  }
} 