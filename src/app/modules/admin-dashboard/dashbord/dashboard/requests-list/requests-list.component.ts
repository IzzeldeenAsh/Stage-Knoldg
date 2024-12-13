import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { Table } from 'primeng/table';
import { Message } from 'primeng/api';
import { Observable, Subscription } from 'rxjs';
import { RequestsService } from 'src/app/_fake/services/requests-list-admin/requests.service';
import { RequestItem } from 'src/app/modules/admin-dashboard/dashbord/dashboard/requests-list/request.interface';

@Component({
  selector: 'app-requests-list',
  templateUrl: './requests-list.component.html',
  styleUrls: ['./requests-list.component.scss']
})
export class RequestsListComponent implements OnInit {
  messages: Message[] = [];
  private unsubscribe: Subscription[] = [];
  requestsList: RequestItem[] = [];
  isLoading$: Observable<boolean>;
  visible: boolean = false;
  selectedRequest: RequestItem | null = null;
  @ViewChild('dt') table: Table;

  constructor(
    private requestsService: RequestsService,
    private cdr: ChangeDetectorRef
  ) {
    this.isLoading$ = this.requestsService.isLoading$;
  }

  ngOnInit(): void {
    this.getRequestsList();
  }

  getRequestsList() {
    const reqSub = this.requestsService.getRequests().subscribe({
      next: (res) => {
        // res is of type RequestResponse
        this.requestsList = res.data;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error fetching requests:', error);
        // Clear existing messages
        this.messages = [];
        this.messages.push({
          severity: 'error',
          summary: 'Error',
          detail: 'An unexpected error occurred.'
        });
      },
    });
    this.unsubscribe.push(reqSub);
  }

  applyFilter(event: any) {
    const value = event.target.value.trim().toLowerCase();
    this.table.filterGlobal(value, 'contains');
  }

    showDialog() {
    this.visible = true;
  }
    onCancel() {
    this.visible = false;
    this.selectedRequest = null;
  }


  get hasErrorMessage() {
    return this.messages.some(msg => msg.severity === 'error');
  }
  viewRequest(request:RequestItem){
    this.selectedRequest = request;
    this.showDialog();
  }
  ngOnDestroy() {
    this.unsubscribe.forEach(sb => sb.unsubscribe());
  }
}
