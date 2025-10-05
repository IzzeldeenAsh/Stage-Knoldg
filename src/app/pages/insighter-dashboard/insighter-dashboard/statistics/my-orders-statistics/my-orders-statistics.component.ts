import { Component, Injector, OnInit } from '@angular/core';
import { BaseComponent } from 'src/app/modules/base.component';
import { OrderStatisticsService, OrderStatistics } from '../../my-orders/order-statistics.service';
import { Observable } from 'rxjs';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';

@Component({
  selector: 'app-my-orders-statistics',
  templateUrl: './my-orders-statistics.component.html',
  styleUrls: ['./my-orders-statistics.component.scss']
})
export class MyOrdersStatisticsComponent extends BaseComponent implements OnInit {
  statistics$: Observable<OrderStatistics | null>;
  isLoading$: Observable<boolean>;
  roles: string[] = [];

  constructor(
    injector: Injector,
    private orderStatisticsService: OrderStatisticsService,
    private proile:ProfileService
  ) {
    super(injector);
    this.statistics$ = this.orderStatisticsService.statistics$;
    this.isLoading$ = this.orderStatisticsService.isLoading$;
    this.getRoles();
  }

  ngOnInit(): void {
    // Load statistics only if not already loaded
    if (!this.orderStatisticsService.getCurrentStatistics() && this.roles.includes('company')) {
      this.orderStatisticsService.loadStatistics();
    }
  }

  getRoles(){
    this.proile.getProfile().subscribe((profile:any)=>{
      this.roles = profile.roles || [];
    })
  }
}