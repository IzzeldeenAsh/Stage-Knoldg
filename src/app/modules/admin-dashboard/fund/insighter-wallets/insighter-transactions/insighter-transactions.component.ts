import { Component, OnInit, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponent } from 'src/app/modules/base.component';
import { FundService, Transaction, PaginatedResponse, KnowledgeDocument } from 'src/app/_fake/services/fund.service';

@Component({
  selector: 'app-insighter-transactions',
  templateUrl: './insighter-transactions.component.html',
  styleUrls: ['./insighter-transactions.component.scss']
})
export class InsighterTransactionsComponent extends BaseComponent implements OnInit {
  transactions: Transaction[] = [];
  isLoading$!: any;
  insighterId!: number;
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  Math = Math;

  constructor(
    injector: Injector,
    private fundService: FundService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    super(injector);
    this.isLoading$ = this.fundService.isLoading$;
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.insighterId = +params['id'];
      this.loadTransactions();
    });
  }

  loadTransactions(page: number = 1): void {
    this.currentPage = page;
    this.unsubscribe.push(
      this.fundService.getInsighterTransactions(this.insighterId, page).subscribe({
        next: (response: PaginatedResponse<Transaction>) => {
          this.transactions = response.data;
          this.totalPages = response.meta.last_page;
          this.totalItems = response.meta.total;
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      })
    );
  }

  goBack(): void {
    this.router.navigate(['/admin-dashboard/admin/fund/insighter-wallets']);
  }

  onPageChange(page: number): void {
    this.loadTransactions(page);
  }

  getTransactionTypeDisplay(type: string): string {
    const typeMap: { [key: string]: string } = {
      'income_meeting': 'Meeting Income',
      'income_knowledge': 'Knowledge Sale',
      'book_meeting': 'Meeting Booking',
      'purchase_knowledge': 'Purchase Knowledge',
      'withdraw': 'Withdrawal',
      'deposit': 'Deposit'
    };
    return typeMap[type] || type;
  }

  getTransactionIcon(transaction: Transaction): string {
    if (transaction.transaction === 'deposit') {
      return 'ki-arrow-down text-success';
    } else {
      return 'ki-arrow-up text-danger';
    }
  }

  getAmountDisplay(transaction: Transaction): string {
    const prefix = transaction.transaction === 'deposit' ? '+' : '';
    return `${prefix}$${Math.abs(transaction.amount)}`;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  }

  getDocumentCount(knowledgeDocuments: KnowledgeDocument[][] | undefined): number {
    if (!knowledgeDocuments) return 0;
    return knowledgeDocuments.reduce((total, group) => total + group.length, 0);
  }

  getFileIcon(extension: string): string {
    const ext = extension.toLowerCase();
    const supportedExtensions = ['csv', 'doc', 'docx', 'jpg', 'mp3', 'mp4', 'pdf', 'ppt', 'pptx', 'pub', 'txt', 'xlsx', 'xsl', 'zip'];
    if (supportedExtensions.includes(ext)) {
      return `assets/media/svg/new-files/${ext}.svg`;
    }
    return 'assets/media/svg/new-files/txt.svg';
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
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