import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-add-knowledge',
  templateUrl: './add-knowledge.component.html',
  styleUrl: './add-knowledge.component.scss'
})
export class AddKnowledgeComponent extends BaseComponent {
  constructor(injector: Injector , ) {
    super(injector);
  }
}
