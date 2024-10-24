import { Component, OnInit } from '@angular/core';
interface DashboardStats{
  icon:string;
  label: string;
}
@Component({
  selector: 'app-dashboard-stats-bar',
  templateUrl: './dashboard-stats-bar.component.html',
})
export class DashboardStatsBarComponent implements OnInit {

  userstats:number=0;
casestats:number=0;
prizestats:number=0;
contractstats:number=0;

dashboardStats:DashboardStats[]=
  [
   
    { icon: './assets/media/icons/duotune/abstract/abs027.svg', label:  `${this.casestats} Departments` },
    { icon: '', label:  `${this.prizestats} Positions` },
    { icon: './assets/media/icons/duotune/abstract/abs022.svg', label: `${this.contractstats} Contracts` }
  ]


ngOnInit(): void {
 this.userstats = 20
 this.casestats = 20
 this.prizestats = 20
 this.contractstats = 20
}




}
