import { Component, Injector } from '@angular/core';
import { UserRequestsService } from 'src/app/_fake/services/user-requests/user-requests.service';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-requests-statistics',
  templateUrl: './requests-statistics.component.html',
  styleUrl: './requests-statistics.component.scss'
})
export class RequestsStatisticsComponent extends BaseComponent {
constructor(injector: Injector, private requests:UserRequestsService){
  super(injector);
}
ngOnInit(){
  this.getRequestsStatistics();
}

public pendingRequests: number = 0;
public approvedRequests: number = 0;
public declinedRequests: number = 0;

getRequestsStatistics(){
  const sub=this.requests.getAllUserRequests(this.lang? this.lang : 'en').subscribe((res: any) => {
    // Reset counters
    this.pendingRequests = 0;
    this.approvedRequests = 0;
    this.declinedRequests = 0;

    // Count requests by status
    res.forEach((request: any) => {
      switch (request.status?.toLowerCase()) {
        case 'pending':
          this.pendingRequests++;
          break;
        case 'approved':
          this.approvedRequests++;
          break;
        case 'declined':
          this.declinedRequests++;
          break;
      }
    });
  });
  this.unsubscribe.push(sub);
}

}
