import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-consulting-schedule-header',
  templateUrl: './consulting-schedule-header.component.html',
  styleUrls: ['./consulting-schedule-header.component.scss']
})
export class ConsultingScheduleHeaderComponent extends BaseComponent implements OnInit {

    constructor(injector: Injector) { 
      super(injector);
    }
  
    ngOnInit(): void {
    }
  
  } 