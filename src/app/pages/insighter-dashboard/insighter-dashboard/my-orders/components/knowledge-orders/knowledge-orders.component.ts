import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { Order } from '../../my-orders.service';
import * as OrderViewUtils from '../../utils/order-view.utils';

type Language = 'ar' | 'en';

type KnowledgeSubTab = 'purchased' | 'sales';

@Component({
  selector: 'app-knowledge-orders',
  templateUrl: './knowledge-orders.component.html',
  styleUrls: ['./knowledge-orders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KnowledgeOrdersComponent {
  @Input() lang: Language = 'en';
  @Input() orders$!: Observable<Order[]>;
  @Input() totalPages$!: Observable<number>;
  @Input() currentPage = 1;
  @Input() isLoading$!: Observable<boolean>;

  @Input() salesOrders$!: Observable<Order[]>;
  @Input() salesTotalPages$!: Observable<number>;
  @Input() currentSalesPage = 1;
  @Input() isSalesLoading$!: Observable<boolean>;

  @Input() canViewSalesTabs = false;
  @Input() knowledgeSubTab: KnowledgeSubTab = 'purchased';
  @Input() selectedInsighterUuid: string | null = null;

  @Output() knowledgeSubTabChange = new EventEmitter<KnowledgeSubTab>();
  @Output() pageChange = new EventEmitter<number>();
  @Output() salesPageChange = new EventEmitter<number>();
  @Output() orderSelected = new EventEmitter<Order>();
  @Output() invoiceDownload = new EventEmitter<Order>();
  @Output() navigateToDownloads = new EventEmitter<Order>();
  @Output() copyOrderNo = new EventEmitter<string>();
  @Output() insighterFilterChange = new EventEmitter<string | null>();

  readonly utils = OrderViewUtils;

  onKnowledgePageChange(event: any): void {
    const nextPage = (event.page || 0) + 1;
    this.pageChange.emit(nextPage);
  }

  onSalesPageChange(event: any): void {
    const nextPage = (event.page || 0) + 1;
    this.salesPageChange.emit(nextPage);
  }

  changeSubTab(tab: KnowledgeSubTab): void {
    this.knowledgeSubTabChange.emit(tab);
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
