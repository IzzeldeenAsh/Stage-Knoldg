import { Component, OnInit, OnDestroy, Injector, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { WalletService, Transaction, TransactionResponse } from 'src/app/_fake/services/wallet/wallet.service';
import { BaseComponent } from 'src/app/modules/base.component';

@Component({
  selector: 'app-wallet',
  templateUrl: './wallet.component.html',
  styleUrls: ['./wallet.component.scss']
})
export class WalletComponent extends BaseComponent implements OnInit, OnDestroy, AfterViewInit {
  private destroy$ = new Subject<void>();
  private resizeObserver: ResizeObserver | null = null;
  
  walletBalance: number = 0;
  transactions: Transaction[] = [];
  totalRecords: number = 0;
  loading: boolean = false;
  
  currentPage: number = 1;
  pageSize: number = 10;
  
  selectedTransaction: Transaction | null = null;
  showDetailsDialog: boolean = false;
  
  chartData: any;
  chartOptions: any;
  
  get tableColumns() {
    return [
      { field: 'service', header: this.lang === 'ar' ? 'الخدمة' : 'Service' },
      { field: 'date', header: this.lang === 'ar' ? 'التاريخ' : 'Date' },
      { field: 'type', header: this.lang === 'ar' ? 'النوع' : 'Type' },
      { field: 'amount', header: this.lang === 'ar' ? 'المبلغ' : 'Amount' },
      { field: 'actions', header: this.lang === 'ar' ? 'التفاصيل' : 'Details' }
    ];
  }

  constructor(
    injector: Injector,
    private walletService: WalletService
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.initializeChart();
    this.loadWalletData();
    this.loadTransactions();
  }
  
  ngAfterViewInit(): void {
    setTimeout(() => {
      this.updateChartSize();
    }, 100);
  }
  
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.updateChartSize();
  }
  
  private updateChartSize(): void {
    if (this.chartData && this.chartOptions) {
      this.chartOptions = {
        ...this.chartOptions,
        responsive: true,
        maintainAspectRatio: false
      };
    }
  }
  
  initializeChart(): void {
    this.chartData = {
      labels: [],
      datasets: [{
        label: this.lang === 'ar' ? 'الرصيد' : 'Balance',
        data: [],
        borderColor: '#4f28ed',
        backgroundColor: 'rgba(79, 40, 237, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: '#4f28ed',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }]
    };
    
    this.chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      aspectRatio: 3,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(79, 40, 237, 0.9)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: 'transparent',
          borderRadius: 8,
          padding: 12,
          displayColors: false,
          callbacks: {
            label: (context: any) => {
              return `$${context.parsed.y.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        x: {
          display: false,
          grid: {
            display: false
          }
        },
        y: {
          display: false,
          grid: {
            display: false
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      },
      layout: {
        padding: 0
      }
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    super.ngOnDestroy();
  }

  loadWalletData(): void {
    this.walletService.getBalance()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (balance) => {
          this.walletBalance = balance;
        },
        error: (error) => {
          this.handleServerErrors(error);
        }
      });
  }

  loadTransactions(page: number = 1): void {
    this.loading = true;
    this.currentPage = page;
    
    this.walletService.getTransactions(page, this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: TransactionResponse) => {
          this.transactions = response.data;
          this.totalRecords = response.meta.total;
          this.loading = false;
          this.updateChart();
        },
        error: (error) => {
          this.loading = false;
          this.handleServerErrors(error);
        }
      });
  }

  updateChart(): void {
    if (this.transactions.length === 0) return;
    
    const last10Transactions = this.transactions.slice(0, 10).reverse();
    const chartDataPoints: number[] = [];
    const chartLabels: string[] = [];
    let runningBalance = this.walletBalance;
    
    last10Transactions.forEach((transaction, index) => {
      if (index === 0) {
        for (let i = last10Transactions.length - 1; i >= 0; i--) {
          const trans = last10Transactions[i];
          const transAmount = Math.abs(trans.amount);
          if (trans.transaction === 'deposit') {
            runningBalance -= transAmount;
          } else {
            runningBalance += transAmount;
          }
        }
      }
      
      const transactionAmount = Math.abs(transaction.amount);
      if (transaction.transaction === 'deposit') {
        runningBalance += transactionAmount;
      } else {
        runningBalance -= transactionAmount;
      }
      
      chartDataPoints.push(runningBalance);
      chartLabels.push(new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    });
    
    this.chartData = {
      ...this.chartData,
      labels: chartLabels,
      datasets: [{
        ...this.chartData.datasets[0],
        data: chartDataPoints
      }]
    };
  }

  onPageChange(event: any): void {
    const page = (event.page || 0) + 1;
    this.loadTransactions(page);
  }

  formatService(service: string): string {
    if (!service) return '';
    
    // Handle special cases
    if (service === 'book_meeting') {
      return this.lang === 'ar' ? 'حجز اجتماع' : 'Book Meeting';
    }
    
    // Default formatting for other services
    return service
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTransactionType(transaction: Transaction): string {
    if (this.lang === 'ar') {
      return transaction.transaction === 'deposit' ? 'إيداع' : 'سحب';
    }
    return transaction.transaction === 'deposit' ? 'Deposit' : 'Withdraw';
  }

  getTransactionSeverity(transaction: Transaction): 'success' | 'danger' {
    return transaction.transaction === 'deposit' ? 'success' : 'danger';
  }
  
  get Math() {
    return Math;
  }

  getAmountClass(transaction: Transaction): string {
    return transaction.transaction === 'deposit' ? 'text-success' : 'text-danger';
  }

  formatAmount(amount: number): string {
    const absAmount = Math.abs(amount);
    const sign = amount >= 0 ? '+' : '-';
    return `${sign}$${absAmount.toFixed(2)}`;
  }

  showTransactionDetails(transaction: Transaction): void {
    this.selectedTransaction = transaction;
    this.showDetailsDialog = true;
  }

  getFileIcon(extension: string): string {
    if (!extension) return 'assets/media/svg/new-files/doc.svg';
    const ext = extension.toLowerCase();
    return `assets/media/svg/new-files/${ext}.svg`;
  }

  getLatestTransactionAmount(): number {
    if (this.transactions.length > 0) {
      return this.transactions[0].amount;
    }
    return 0;
  }

  getLatestTransactionType(): string {
    if (this.transactions.length > 0) {
      return this.transactions[0].transaction;
    }
    return '';
  }

  // Translation helper methods
  getTranslation(key: string): string {
    const translations: { [key: string]: { en: string; ar: string } } = {
      'currentWalletBalance': { en: 'Current Wallet Balance', ar: 'رصيد المحفظة الحالي' },
      'transactionsHistory': { en: 'Transactions History', ar: 'سجل المعاملات' },
      'transactionsSubtitle': { en: 'Track money coming in and going out from this area.', ar: 'تتبع الأموال الواردة والصادرة من هذه المنطقة.' },
      'service': { en: 'Service', ar: 'الخدمة' },
      'date': { en: 'Date', ar: 'التاريخ' },
      'type': { en: 'Type', ar: 'النوع' },
      'amount': { en: 'Amount', ar: 'المبلغ' },
      'details': { en: 'Details', ar: 'التفاصيل' },
      'deposit': { en: 'Deposit', ar: 'إيداع' },
      'withdraw': { en: 'Withdraw', ar: 'سحب' },
      'noTransactions': { en: 'No transactions found', ar: 'لم يتم العثور على معاملات' },
      'showingPage': { en: 'Showing page', ar: 'عرض الصفحة' },
      'of': { en: 'of', ar: 'من' },
      'pages': { en: 'pages', ar: 'صفحات' },
      'transactionDetails': { en: 'Transaction Details', ar: 'تفاصيل المعاملة' },
      'transactionType': { en: 'Transaction Type', ar: 'نوع المعاملة' },
      'orderInformation': { en: 'Order Information', ar: 'معلومات الطلب' },
      'orderNumber': { en: 'Order Number', ar: 'رقم الطلب' },
      'invoiceNumber': { en: 'Invoice Number', ar: 'رقم الفاتورة' },
      'status': { en: 'Status', ar: 'الحالة' },
      'knowledgeItems': { en: 'Knowledge Items', ar: 'عناصر المعرفة' },
      'close': { en: 'Close', ar: 'إغلاق' },
      'viewDetails': { en: 'View Details', ar: 'عرض التفاصيل' },
      'balance': { en: 'Balance', ar: 'الرصيد' }
    };
    
    return translations[key] ? translations[key][this.lang === 'ar' ? 'ar' : 'en'] : key;
  }

  private handleServerErrors(error: any): void {
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