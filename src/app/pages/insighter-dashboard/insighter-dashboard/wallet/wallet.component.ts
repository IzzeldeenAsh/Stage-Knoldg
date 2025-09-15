import { Component, OnInit, OnDestroy, Injector, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { WalletService, Transaction, TransactionResponse, SubOrder, MeetingBooking } from 'src/app/_fake/services/wallet/wallet.service';
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
      { field: 'type', header: this.lang === 'ar' ? 'المعاملة' : 'Transaction' },
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
          enabled: false,
          external: (context: any) => {
            const { chart, tooltip } = context;
            
            let tooltipEl = document.body.querySelector('.chartjs-wallet-tooltip') as HTMLElement;
            
            if (!tooltipEl) {
              tooltipEl = document.createElement('div');
              tooltipEl.classList.add('chartjs-wallet-tooltip');
              tooltipEl.style.position = 'fixed';
              tooltipEl.style.zIndex = '99999';
              tooltipEl.style.pointerEvents = 'none';
              tooltipEl.style.transition = 'opacity 0.2s ease';
              document.body.appendChild(tooltipEl);
            }
            
            if (tooltip.opacity === 0) {
              tooltipEl.style.opacity = '0';
              return;
            }
            
            if (tooltip.body) {
              const dataIndex = tooltip.dataPoints[0].dataIndex;
              const transaction = this.chartData.datasets[0].transactionData[dataIndex];
              const balance = tooltip.dataPoints[0].parsed.y;
              
              if (transaction) {
                const date = new Date(transaction.date);
                const dateString = date.toLocaleDateString('en-US', {
                  month: '2-digit',
                  day: '2-digit',
                  year: 'numeric'
                }) + ' ' + date.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: false
                });
                
                const transactionType = this.getTransactionType(transaction);
                const amount = Math.abs(transaction.amount);
                const isDeposit = transaction.transaction === 'deposit';
                
                tooltipEl.innerHTML = `
                  <div class="tooltip-content" style="
                    background: white;
                    border: 1px solid #e3e6f0;
                    border-radius: 8px;
                    font-size: 13px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
                    width: auto;
                    min-width: 160px;
                  ">
                    <div class="tooltip-header" style="
                      background: #f8f9fa;
                      padding: 6px 12px;
                      border-radius: 8px 8px 0 0;
                      font-size: 12px;
                      color: #6c757d;
                      border-bottom: 1px solid #e9ecef;
                      text-align: center;
                    ">${dateString}</div>
                    <div class="tooltip-body" style="padding: 8px 12px;">
                      <div class="tooltip-row" style="display: flex; align-items: center; margin-bottom: 4px;">
                        <span class="tooltip-dot" style="
                          width: 6px;
                          height: 6px;
                          border-radius: 50%;
                          margin-right: 8px;
                          background: ${isDeposit ? '#2c3e50' : '#17a2b8'};
                        "></span>
                        <span class="tooltip-label" style="
                          flex: 1;
                          font-size: 13px;
                          font-weight: 500;
                          color: #333;
                          margin-right: 8px;
                        ">${transactionType}</span>
                        <span class="tooltip-value" style="
                          font-size: 13px;
                          font-weight: 600;
                          color: #333;
                        ">$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                      </div>
                      <div class="tooltip-row" style="display: flex; align-items: center;">
                        <span class="tooltip-dot" style="
                          width: 6px;
                          height: 6px;
                          border-radius: 50%;
                          margin-right: 8px;
                          background: #6c757d;
                        "></span>
                        <span class="tooltip-label" style="
                          flex: 1;
                          font-size: 13px;
                          font-weight: 500;
                          color: #333;
                          margin-right: 8px;
                        ">Balance</span>
                        <span class="tooltip-value" style="
                          font-size: 13px;
                          font-weight: 600;
                          color: #333;
                        ">$${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                `;
              }
            }
            
            // Get canvas position relative to viewport
            const canvasRect = chart.canvas.getBoundingClientRect();
            
            // Calculate tooltip position using viewport coordinates
            let tooltipX = canvasRect.left + tooltip.caretX + 10;
            let tooltipY = canvasRect.top + tooltip.caretY - 70;
            
            // Keep tooltip within viewport bounds
            const tooltipWidth = 160;
            const tooltipHeight = 80;
            
            // Adjust horizontal position
            if (tooltipX + tooltipWidth > window.innerWidth) {
              tooltipX = canvasRect.left + tooltip.caretX - tooltipWidth - 10;
            }
            if (tooltipX < 0) {
              tooltipX = 10;
            }
            
            // Adjust vertical position  
            if (tooltipY < 0) {
              tooltipY = canvasRect.top + tooltip.caretY + 20;
            }
            if (tooltipY + tooltipHeight > window.innerHeight) {
              tooltipY = canvasRect.top + tooltip.caretY - tooltipHeight - 10;
            }
            
            tooltipEl.style.opacity = '1';
            tooltipEl.style.left = tooltipX + 'px';
            tooltipEl.style.top = tooltipY + 'px';
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
    const last10Transactions = this.transactions.slice(0, 10).reverse();
    const chartDataPoints: number[] = [];
    const chartLabels: string[] = [];
    const transactionData: Transaction[] = [];
    let runningBalance = this.walletBalance;

    // If there are no transactions, show a default point at current day with value 0
    if (this.transactions.length === 0) {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      // Add two points to create a flat line at 0
      chartDataPoints.push(0, 0);
      chartLabels.push(
        yesterday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      );

      // Add dummy transactions for tooltips
      transactionData.push(
        {
          id: 0,
          amount: 0,
          transaction: 'balance',
          date: yesterday.toISOString(),
          type: 'balance'
        } as any,
        {
          id: 0,
          amount: 0,
          transaction: 'balance',
          date: today.toISOString(),
          type: 'balance'
        } as any
      );

      this.chartData = {
        ...this.chartData,
        labels: chartLabels,
        datasets: [{
          ...this.chartData.datasets[0],
          data: chartDataPoints,
          transactionData: transactionData
        }]
      };
      return;
    }

    // Calculate initial balance before all transactions
    for (let i = last10Transactions.length - 1; i >= 0; i--) {
      const trans = last10Transactions[i];
      const transAmount = Math.abs(trans.amount);
      if (trans.transaction === 'deposit') {
        runningBalance -= transAmount;
      } else {
        runningBalance += transAmount;
      }
    }

    // If there's only one transaction, add a starting point at 0 or previous balance
    if (last10Transactions.length === 1) {
      const startingBalance = runningBalance;
      chartDataPoints.push(startingBalance);

      // Create a label for the starting point (one day before the transaction)
      const transactionDate = new Date(last10Transactions[0].date);
      const startDate = new Date(transactionDate.getTime() - 24 * 60 * 60 * 1000);
      chartLabels.push(startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

      // Add a dummy transaction for the starting point
      transactionData.push({
        ...last10Transactions[0],
        date: startDate.toISOString(),
        amount: 0,
        transaction: 'balance'
      } as any);
    }

    // Process all transactions
    last10Transactions.forEach((transaction) => {
      const transactionAmount = Math.abs(transaction.amount);
      if (transaction.transaction === 'deposit') {
        runningBalance += transactionAmount;
      } else {
        runningBalance -= transactionAmount;
      }

      chartDataPoints.push(runningBalance);
      chartLabels.push(new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      transactionData.push(transaction);
    });

    this.chartData = {
      ...this.chartData,
      labels: chartLabels,
      datasets: [{
        ...this.chartData.datasets[0],
        data: chartDataPoints,
        transactionData: transactionData
      }]
    };
  }

  onPageChange(event: any): void {
    const page = (event.page || 0) + 1;
    this.loadTransactions(page);
  }

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
    const sign = amount >= 0 ? '+' : '(';
    const closeSign = amount >= 0 ? '' : ')';
    const openSign = amount >= 0 ? '' : '(';
    return `${openSign}$${absAmount.toFixed(2)}${closeSign}`;
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

  formatMeetingDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
      'type': { en: 'Transaction', ar: 'المعاملة' },
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
      'meetingDetails': { en: 'Meeting Details', ar: 'تفاصيل الاجتماع' },
      'meetingTitle': { en: 'Meeting Title', ar: 'عنوان الاجتماع' },
      'meetingStatus': { en: 'Meeting Status', ar: 'حالة الاجتماع' },
      'meetingDate': { en: 'Meeting Date', ar: 'تاريخ الاجتماع' },
      'meetingTime': { en: 'Meeting Time', ar: 'وقت الاجتماع' },
      'meetingDescription': { en: 'Description', ar: 'الوصف' },
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