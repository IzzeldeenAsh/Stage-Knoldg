import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { Order } from '../../my-orders/my-orders.service';
import * as OrderViewUtils from '../../my-orders/utils/order-view.utils';

type Language = 'ar' | 'en';

@Component({
  selector: 'app-sold-knowledge-details',
  templateUrl: './sold-knowledge-details.component.html',
  styleUrls: ['./sold-knowledge-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SoldKnowledgeDetailsComponent {
  @Input() lang: Language = 'en';
  @Input() salesOrders$!: Observable<Order[]>;
  @Input() salesTotalPages$!: Observable<number>;
  @Input() currentSalesPage = 1;
  @Input() isSalesLoading$!: Observable<boolean>;
  @Input() selectedInsighterUuid: string | null = null;
  @Input() roles: string[] = [];

  @Output() salesPageChange = new EventEmitter<number>();
  @Output() orderSelected = new EventEmitter<Order>();
  @Output() invoiceDownload = new EventEmitter<Order>();
  @Output() navigateToDownloads = new EventEmitter<Order>();
  @Output() copyOrderNo = new EventEmitter<string>();
  @Output() insighterFilterChange = new EventEmitter<string | null>();

  readonly utils = OrderViewUtils;

  get shouldShowInsighterFilter(): boolean {
    return this.roles.includes('company');
  }

  onSalesPageChange(event: any): void {
    const nextPage = (event.page || 0) + 1;
    this.salesPageChange.emit(nextPage);
  }

  selectOrder(order: Order): void {
    this.orderSelected.emit(order);
  }

  downloadInvoice(order: Order): void {
    this.invoiceDownload.emit(order);
  }

  openDownloads(order: Order): void {
    this.navigateToDownloads.emit(order);
  }

  copyOrder(orderNo: string): void {
    this.copyOrderNo.emit(orderNo);
  }

  onInsighterFilterChange(insighterUuid: string | null): void {
    this.insighterFilterChange.emit(insighterUuid);
  }
}