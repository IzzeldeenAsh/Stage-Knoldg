import { Component, inject, Injector, OnInit } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-downloads-statistics',
  templateUrl: './downloads-statistics.component.html',
  styleUrls: ['./downloads-statistics.component.scss']
})
export class DownloadsStatisticsComponent extends BaseComponent implements OnInit {

  constructor(injector: Injector) { 
    super(injector);
  }

  ngOnInit(): void {
  }

} 