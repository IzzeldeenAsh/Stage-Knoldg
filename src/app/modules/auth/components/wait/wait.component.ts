import { Component } from '@angular/core';
import { ScrollAnimsService } from 'src/app/_fake/services/scroll-anims/scroll-anims.service';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-wait',
  templateUrl: './wait.component.html',
  styleUrl: './wait.component.scss'
})
export class WaitComponent extends BaseComponent {
constructor(scrollAnims: ScrollAnimsService) {
  super(scrollAnims);
}
}
