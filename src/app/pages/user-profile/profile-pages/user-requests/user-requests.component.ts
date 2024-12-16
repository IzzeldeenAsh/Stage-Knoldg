import { Component, Injector, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { UserRequestsService } from 'src/app/_fake/services/user-requests/user-requests.service';
import { UserRequest } from 'src/app/_fake/services/user-requests/user-requests.service';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-user-requests',
  templateUrl: './user-requests.component.html',
  styleUrls: ['./user-requests.component.scss']
})
export class UserRequestsComponent extends BaseComponent implements OnInit {
  userRequests: UserRequest[] = [];
  filteredUserRequests: UserRequest[] = [];
  isLoading$!: Observable<boolean>;
  selectedType: string = '';
  selectedStatus: string = '';

  // Dialog properties
  displayRequestDialog: boolean = false;
  selectedRequest: UserRequest | null = null;

  constructor( 
    injector: Injector,
    private userRequestsService: UserRequestsService
  ){
    super(injector);
    this.isLoading$ = this.userRequestsService.isLoading$;      
  }

  ngOnInit(): void {
    const userReqSub = this.userRequestsService.getAllUserRequests(this.lang).subscribe((res: any) => {
      this.userRequests = res;
      this.filteredUserRequests = this.userRequests;
    });
    this.unsubscribe.push(userReqSub);
  }

  filterRequests() {
    this.filteredUserRequests = this.userRequests.filter(request => {
      const matchesType = this.selectedType ? request.type.key === this.selectedType : true;
      const matchesStatus = this.selectedStatus ? request.status === this.selectedStatus : true;
      return matchesType && matchesStatus;
    });
  }

  openRequestDialog(request: UserRequest) {
    this.selectedRequest = request;
    this.displayRequestDialog = true;
  }

  // Optionally, add methods to view stock or other actions
  viewFilteredStock() {
    // Implement the logic to view stock based on filtered requests
    // For example, navigate to a stock page or open another dialog
  }
}
