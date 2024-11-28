import { Component, Input } from '@angular/core';
import { IForsightaProfile } from 'src/app/_fake/models/profile.interface';

@Component({
  selector: 'app-action-buttons',
  templateUrl: './action-buttons.component.html',
  styleUrl: './action-buttons.component.scss'
})
export class ActionButtonsComponent {
@Input() profile:IForsightaProfile;
}
