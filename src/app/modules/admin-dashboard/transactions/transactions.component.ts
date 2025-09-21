import { Component, OnInit, ViewChild, Injector } from '@angular/core';
import { TransactionsService, Transaction, TransactionResponse } from '../services/transactions.service';
import { Table } from 'primeng/table';
import { BaseComponent } from '../../base.component';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent extends BaseComponent implements OnInit {
  @ViewChild('dt') table!: Table;

  transactions: Transaction[] = [];
  loading = false;
  totalRecords = 0;
  rows = 10;
  first = 0;
  selectedTransaction: Transaction | null = null;
  displayDialog = false;

  constructor(
    private transactionsService: TransactionsService,
    protected injector: Injector
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(event?: any): void {
    this.loading = true;
    const page = event ? (event.first / event.rows) + 1 : 1;
    const perPage = event ? event.rows : this.rows;

    this.transactionsService.getTransactions(page, perPage).subscribe({
      next: (response: TransactionResponse) => {
        this.transactions = response.data;
        this.totalRecords = response.meta.total;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.handleServerErrors(error);
      }
    });
  }

  showTransactionDetails(transaction: Transaction): void {
    this.selectedTransaction = transaction;
    this.displayDialog = true;
  }

  getTransactionSeverity(type: string): "success" | "secondary" | "info" | "warning" | "danger" | "contrast" | undefined {
    switch (type.toLowerCase()) {
      case 'deposit':
        return 'success';
      case 'withdraw':
        return 'danger';
      default:
        return 'info';
    }
  }

  getTransactionTypeLabel(type: string): string {
    const typeLabels: { [key: string]: string } = {
      'income_knowledge': 'Knowledge Income',
      'withdraw_payout_insighter_knowledge': 'Insighter Knowledge Payout',
      'book_meeting': 'Meeting Booking',
      'withdraw_payout_insighter_meeting': 'Insighter Meeting Payout',
      'income_case': 'Case Income',
      'withdraw_payout_insighter_case': 'Insighter Case Payout',
      'income_prize': 'Prize Income',
      'withdraw_payout_insighter_prize': 'Insighter Prize Payout'
    };
    return typeLabels[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));
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
    return '/assets/media/svg/new-files/txt.svg';
  }

  shouldShowInsighterInfo(type: string): boolean {
    return type === 'withdraw_payout_insighter_knowledge' || type === 'withdraw_payout_insighter_meeting';
  }

  getTransactionBadgeClass(type: string): string {
    switch (type.toLowerCase()) {
      case 'deposit':
        return 'badge-light-success';
      case 'withdraw':
        return 'badge-light-danger';
      default:
        return 'badge-light-info';
    }
  }

  getMeetingStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'badge-light-warning';
      case 'completed':
        return 'badge-light-success';
      case 'cancelled':
        return 'badge-light-danger';
      case 'postponed':
        return 'badge-light-info';
      default:
        return 'badge-light-secondary';
    }
  }

  private handleServerErrors(error: any) {
    if (error.error && error.error.errors) {
      const serverErrors = error.error.errors;
      for (const key in serverErrors) {
        if (serverErrors.hasOwnProperty(key)) {
          const messages = serverErrors[key];
          this.showError(
            this.lang === "ar" ? "حدث خطأ" : "An error occurred",
            messages.join(", ")
          );
        }
      }
    } else {
      this.showError(
        this.lang === "ar" ? "حدث خطأ" : "An error occurred",
        this.lang === "ar" ? "حدث خطأ" : "An unexpected error occurred."
      );
    }
  }
}