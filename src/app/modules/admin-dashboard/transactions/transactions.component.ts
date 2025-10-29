import { Component, OnInit, OnDestroy, ViewChild, Injector } from '@angular/core';
import { TransactionsService, Transaction, TransactionResponse, PlatformBalanceResponse, ChartDataPoint } from '../services/transactions.service';
import { Table } from 'primeng/table';
import { BaseComponent } from '../../base.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent extends BaseComponent implements OnInit, OnDestroy {
  @ViewChild('dt') table!: Table;

  private destroy$ = new Subject<void>();

  transactions: Transaction[] = [];
  loading = false;
  totalRecords = 0;
  rows = 10;
  first = 0;
  selectedTransaction: Transaction | null = null;
  displayDialog = false;

  // Balance properties
  platformBalance: number = 0;
  balanceLoading: boolean = false;

  // Chart properties
  chartData: any;
  chartOptions: any;
  chartApiData: ChartDataPoint[] = [];
  hasRealData: boolean = false;
  selectedPeriod: 'weekly' | 'monthly' | 'yearly' = 'monthly';

  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 10;

  // Period options for custom select buttons
  periodOptions: Array<{label: string; labelAr: string; value: 'weekly' | 'monthly' | 'yearly'}> = [
    { label: 'Weekly', labelAr: 'أسبوعي', value: 'weekly' },
    { label: 'Monthly', labelAr: 'شهري', value: 'monthly' },
    { label: 'Yearly', labelAr: 'سنوي', value: 'yearly' }
  ];

  constructor(
    private transactionsService: TransactionsService,
    protected injector: Injector
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.loadTransactions();
    this.loadPlatformBalance();
    this.loadChartData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    super.ngOnDestroy();
  }

  loadTransactions(event?: any): void {
    this.loading = true;
    const page = event ? (event.first / event.rows) + 1 : 1;
    const perPage = event ? event.rows : this.rows;

    this.transactionsService.getTransactions(page, perPage, this.selectedPeriod).subscribe({
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
      return `assets/media/svg/new-files/${ext}.svg`;
    }
    return 'assets/media/svg/new-files/txt.svg';
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

  loadPlatformBalance(): void {
    this.balanceLoading = true;
    this.transactionsService.getPlatformBalance()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: PlatformBalanceResponse) => {
          this.platformBalance = response.data.balance;
          this.balanceLoading = false;
        },
        error: (error) => {
          this.balanceLoading = false;
          this.handleServerErrors(error);
        }
      });
  }

  loadChartData(): void {
    this.transactionsService.getChartData(this.selectedPeriod)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.chartApiData = response.data;
          this.hasRealData = this.chartApiData.length > 0;
          if (this.hasRealData) {
            this.initializeChart();
          }
        },
        error: (error) => {
          this.handleServerErrors(error);
          this.hasRealData = false;
          this.chartApiData = [];
        }
      });
  }


  initializeChart(): void {
    if (!this.chartApiData || this.chartApiData.length === 0) {
      return;
    }

    const labels = this.chartApiData.map(item => {
      // For the new API structure, date is already formatted (Mon, Tue, Jan, Feb, 2025, etc.)
      return item.date;
    });

    // Create gradients
    const createGradient = (ctx: CanvasRenderingContext2D, color1: string, color2: string) => {
      const gradient = ctx.createLinearGradient(0, 0, 0, 400);
      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);
      return gradient;
    };

    this.chartData = {
      labels: labels,
      datasets: [
        {
          label: this.lang === 'ar' ? 'الإيداعات' : 'Deposits',
          data: this.chartApiData.map(item => item.deposits),
          borderColor: '#10b981',
          backgroundColor: (ctx: any) => {
            const chart = ctx.chart;
            const {ctx: canvasCtx} = chart;
            return createGradient(canvasCtx, 'rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0)');
          },
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#10b981',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 3
        },
        {
          label: this.lang === 'ar' ? 'السحوبات' : 'Withdrawals',
          data: this.chartApiData.map(item => item.withdrawals),
          borderColor: '#ef4444',
          backgroundColor: (ctx: any) => {
            const chart = ctx.chart;
            const {ctx: canvasCtx} = chart;
            return createGradient(canvasCtx, 'rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0)');
          },
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#ef4444',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#ef4444',
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 3
        }
      ]
    };

    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#ffffff',
          titleColor: '#1f2937',
          bodyColor: '#1f2937',
          borderColor: '#e5e7eb',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          usePointStyle: true,
          padding: 12,
          titleFont: {
            size: 12,
            weight: '600'
          },
          bodyFont: {
            size: 11
          },
          callbacks: {
            title: (context: any) => {
              const dataIndex = context[0].dataIndex;
              const dateValue = this.chartApiData[dataIndex].date;

              // Handle different period formats
              if (this.selectedPeriod === 'weekly') {
                // For weekly, dateValue is like "Mon", "Tue", etc.
                const dayNames = {
                  'Mon': 'Monday',
                  'Tue': 'Tuesday',
                  'Wed': 'Wednesday',
                  'Thu': 'Thursday',
                  'Fri': 'Friday',
                  'Sat': 'Saturday',
                  'Sun': 'Sunday'
                };
                return dayNames[dateValue as keyof typeof dayNames] || dateValue;
              } else if (this.selectedPeriod === 'monthly') {
                // For monthly, dateValue is like "Jan", "Feb", etc.
                const monthNames = {
                  'Jan': 'January',
                  'Feb': 'February',
                  'Mar': 'March',
                  'Apr': 'April',
                  'May': 'May',
                  'Jun': 'June',
                  'Jul': 'July',
                  'Aug': 'August',
                  'Sep': 'September',
                  'Oct': 'October',
                  'Nov': 'November',
                  'Dec': 'December'
                };
                return monthNames[dateValue as keyof typeof monthNames] || dateValue;
              } else if (this.selectedPeriod === 'yearly') {
                // For yearly, dateValue is like "2025"
                return `Year ${dateValue}`;
              }

              // Fallback for any other format
              return dateValue;
            },
            label: (context: any) => {
              return `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'category',
          grid: {
            color: '#f3f4f6',
            lineWidth: 1,
            drawBorder: false
          },
          ticks: {
            color: '#6b7280',
            font: {
              size: 11
            },
            autoSkip: this.selectedPeriod === 'monthly' ? false : true,
            maxTicksLimit: this.selectedPeriod === 'monthly' ? 12 : (this.selectedPeriod === 'weekly' ? 7 : undefined)
          }
        },
        y: {
          grid: {
            color: '#f3f4f6',
            lineWidth: 1,
            drawBorder: false
          },
          ticks: {
            color: '#6b7280',
            font: {
              size: 11
            },
            callback: function(value: any, index: number, ticks: any[]) {
              // Only show first and last tick values
              if (index === 0 || index === ticks.length - 1) {
                return '$' + value.toLocaleString();
              }
              return '';
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    };
  }

  getChartLegendData(): {label: string, value: string, color: string}[] {
    if (!this.chartApiData || this.chartApiData.length === 0) {
      return [
        {
          label: this.lang === 'ar' ? 'الدخل' : 'Income',
          value: '$0',
          color: '#10b981'
        },
        {
          label: this.lang === 'ar' ? 'المصروفات' : 'Expenditure',
          value: '$0',
          color: '#ef4444'
        }
      ];
    }

    const totalIncome = this.chartApiData.reduce((sum, item) => sum + item.deposits, 0);
    const totalExpenditure = this.chartApiData.reduce((sum, item) => sum + item.withdrawals, 0);

    return [
      {
        label: this.lang === 'ar' ? 'الدخل' : 'Income',
        value: `$${totalIncome.toLocaleString()}`,
        color: '#10b981'
      },
      {
        label: this.lang === 'ar' ? 'المصروفات' : 'Expenditure',
        value: `$${totalExpenditure.toLocaleString()}`,
        color: '#ef4444'
      }
    ];
  }

  // Added methods to match wallet component
  formatService(service: string): string {
    if (!service) return '';

    // Handle special cases for meeting-related transactions
    if (service === 'book_meeting') {
      return this.lang === 'ar' ? 'حجز اجتماع' : 'Book Meeting';
    }
    if (service === 'income_meeting') {
      return this.lang === 'ar' ? 'دخل من اجتماع' : 'Meeting Income';
    }
    if (service === 'income_knowledge') {
      return this.lang === 'ar' ? 'دخل من المعرفة' : 'Knowledge Income';
    }
    if (service === 'purchase_knowledge') {
      return this.lang === 'ar' ? 'شراء المعرفة' : 'Knowledge Purchase';
    }

    // Default formatting for other services
    return service
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getTransactionType(transaction: Transaction): string {
    if (this.lang === 'ar') {
      return transaction.transaction === 'deposit' ? 'إيداع' : 'سحب';
    }
    return transaction.transaction === 'deposit' ? 'Deposit' : 'Withdraw';
  }

  formatAmount(amount: number): string {
    const absAmount = Math.abs(amount);
    const closeSign = amount >= 0 ? '' : ')';
    const openSign = amount >= 0 ? '' : '(';
    return `${openSign}$${absAmount.toFixed(2)}${closeSign}`;
  }

  setPeriod(period: 'weekly' | 'monthly' | 'yearly'): void {
    this.selectedPeriod = period;
    this.currentPage = 1; // Reset to first page when period changes
    this.loadChartData(); // Reload chart data with new period
    this.loadTransactions(); // Reload table data
  }

  onPageChange(event: any): void {
    this.currentPage = (event.page || 0) + 1;
    this.loadTransactions(event);
  }

  get Math() {
    return Math;
  }

  getDocumentCount(knowledgeDocuments: any[][] | undefined): number {
    if (!knowledgeDocuments) return 0;
    return knowledgeDocuments.reduce((total, group) => total + group.length, 0);
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