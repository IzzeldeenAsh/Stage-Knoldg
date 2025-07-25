import { Component, Injector, OnInit, signal } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-read-later-statistics',
  templateUrl: './read-later-statistics.component.html',
  styleUrls: ['./read-later-statistics.component.scss']
})
export class ReadLaterStatisticsComponent extends BaseComponent implements OnInit {

  constructor(
    injector:Injector,
  ) {
    super(injector);
  }

  ngOnInit(): void {
    // Statistics will be loaded from the main component or service
  }
}