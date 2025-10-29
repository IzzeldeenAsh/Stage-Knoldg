import { Component, OnInit, ViewChild } from '@angular/core';
import { AdminOrdersService, Order, OrderResponse } from '../services/admin-orders.service';
import { Table } from 'primeng/table';
import { MessageService } from 'primeng/api';
import { ServiceNamePipe } from '../../../shared/pipes/service-name.pipe';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent implements OnInit {
  @ViewChild('dt') table!: Table;
  
  orders: Order[] = [];
  loading = false;
  totalRecords = 0;
  rows = 10;
  first = 0;
  selectedOrder: Order | null = null;
  displayDialog = false;

  constructor(
    private ordersService: AdminOrdersService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(event?: any): void {
    this.loading = true;
    const page = event ? (event.first / event.rows) + 1 : 1;
    const perPage = event ? event.rows : this.rows;

    this.ordersService.getOrders(page, perPage).subscribe({
      next: (response: OrderResponse) => {
        this.orders = response.data;
        this.totalRecords = response.meta.total;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load orders'
        });
        console.error('Error loading orders:', error);
      }
    });
  }

  showOrderDetails(order: Order): void {
    this.selectedOrder = order;
    this.displayDialog = true;
  }

  getStatusSeverity(status: string): "success" | "secondary" | "info" | "warning" | "danger" | "contrast" | undefined {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'danger';
      default:
        return 'info';
    }
  }

  getFulfillmentSeverity(status: string): "success" | "secondary" | "info" | "warning" | "danger" | "contrast" | undefined {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'danger';
      default:
        return 'info';
    }
  }

  getPaymentMethodLabel(method: string): string {
    switch (method.toLowerCase()) {
      case 'free':
        return 'Free';
      case 'provider':
        return 'Payment Provider';
      case 'manual':
        return 'Wallet Payment';
      default:
        return method;
    }
  }

  formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  getFileIcon(extension: string): string {
    const ext = extension.toLowerCase();
    const supportedExtensions = ['csv', 'doc', 'docx', 'jpg', 'mp3', 'mp4', 'pdf', 'ppt', 'pptx', 'pub', 'txt', 'xlsx', 'xsl', 'zip'];
    if (supportedExtensions.includes(ext)) {
      return `/assets/media/svg/new-files/${ext}.svg`;
    }
    return '/assets/media/svg/new-files/txt.svg'; // default icon
  }

  getStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'badge-light-success';
      case 'pending':
        return 'badge-light-warning';
      case 'failed':
        return 'badge-light-danger';
      default:
        return 'badge-light-info';
    }
  }

  getFulfillmentBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'badge-light-success';
      case 'pending':
        return 'badge-light-warning';
      case 'failed':
        return 'badge-light-danger';
      default:
        return 'badge-light-info';
    }
  }
}