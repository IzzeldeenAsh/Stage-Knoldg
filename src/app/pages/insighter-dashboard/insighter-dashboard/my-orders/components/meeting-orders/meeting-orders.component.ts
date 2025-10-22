import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { Order } from '../../my-orders.service';
import * as OrderViewUtils from '../../utils/order-view.utils';

type Language = 'ar' | 'en';

@Component({
  selector: 'app-meeting-orders',
  templateUrl: './meeting-orders.component.html',
  styleUrls: ['./meeting-orders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MeetingOrdersComponent {
  @Input() lang: Language = 'en';
  @Input() meetingOrders$!: Observable<Order[]>;
  @Input() meetingTotalPages$!: Observable<number>;
  @Input() currentMeetingPage = 1;
  @Input() isMeetingLoading$!: Observable<boolean>;


  @Output() meetingPageChange = new EventEmitter<number>();
  @Output() meetingOrderSelected = new EventEmitter<Order>();
  @Output() invoiceDownload = new EventEmitter<Order>();
  @Output() copyOrderNo = new EventEmitter<string>();

  readonly utils = OrderViewUtils;


  onMeetingPageChange(event: any): void {
    const nextPage = (event.page || 0) + 1;
    this.meetingPageChange.emit(nextPage);
  }


  selectOrder(order: Order): void {
    this.meetingOrderSelected.emit(order);
  }

  downloadInvoice(order: Order): void {
    this.invoiceDownload.emit(order);
  }

  copyOrder(orderNo: string): void {
    this.copyOrderNo.emit(orderNo);
  }

}
