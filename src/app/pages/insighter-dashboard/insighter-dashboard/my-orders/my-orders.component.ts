import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponent } from 'src/app/modules/base.component';
import { MyOrdersService, Order, OrdersResponse } from './my-orders.service';
import { OrderStatisticsService } from './order-statistics.service';
import { Observable, catchError, of } from 'rxjs';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';

@Component({
  selector: 'app-my-orders',
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyOrdersComponent extends BaseComponent implements OnInit {
  activeTab: 'knowledge' | 'meeting' = 'knowledge';
  knowledgeSubTab: 'purchased' | 'sales' = 'purchased';
  meetingSubTab: 'purchased' | 'sales' = 'purchased';
  
  orders$: Observable<Order[]> = of([]);
  totalPages$: Observable<number> = of(0);
  currentPage = 1;
  selectedOrder: Order | null = null;
  showOrderDetails = false;

  salesOrders$: Observable<Order[]> = of([]);
  salesTotalPages$: Observable<number> = of(0);
  currentSalesPage = 1;

  meetingOrders$: Observable<Order[]> = of([]);
  meetingTotalPages$: Observable<number> = of(0);
  currentMeetingPage = 1;
  selectedMeetingOrder: Order | null = null;
  showMeetingOrderDetails = false;

  meetingSalesOrders$: Observable<Order[]> = of([]);
  meetingSalesTotalPages$: Observable<number> = of(0);
  currentMeetingSalesPage = 1;

  roles: string[] = [];
  selectedInsighterUuid: string | null = null;
  private knowledgeSalesLoaded = false;
  private meetingSalesLoaded = false;
  private rolesLoaded = false;
  constructor(
    injector: Injector,
    private myOrdersService: MyOrdersService,
    private router: Router,
    private proile:ProfileService,
    public orderStatisticsService: OrderStatisticsService
  ) {
    super(injector);
  }

  getRoles(){
    this.proile.getProfile().subscribe((profile:any)=>{
      this.roles = profile.roles || [];
      this.rolesLoaded = true;

      if (this.knowledgeSubTab === 'sales' && this.canViewSalesTabs && !this.knowledgeSalesLoaded) {
        this.loadSalesKnowledgeOrders(this.currentSalesPage);
      }

      if (this.meetingSubTab === 'sales' && this.canViewSalesTabs && !this.meetingSalesLoaded) {
        this.loadSalesMeetingOrders(this.currentMeetingSalesPage);
      }
    })
  }

  get isLoading$() {
    return this.myOrdersService.isLoading$;
  }

  get isMeetingLoading$() {
    return this.myOrdersService.isMeetingLoading$;
  }

  get isSalesLoading$() {
    return this.myOrdersService.isSalesLoading$;
  }

  get isMeetingSalesLoading$() {
    return this.myOrdersService.isMeetingSalesLoading$;
  }

  get canViewSalesTabs(): boolean {
    return this.roles.includes('company');
  }

  get currentLang(): 'ar' | 'en' {
    return this.lang === 'ar' ? 'ar' : 'en';
  }

  ngOnInit(): void {
    this.getRoles();
    this.loadOrders();
    this.loadMeetingOrders();
    // Load statistics only if not already loaded by the header component
    if (!this.orderStatisticsService.getCurrentStatistics() && this.roles.includes('company')) {
      this.orderStatisticsService.loadStatistics();
    }
  }

  setActiveTab(tab: 'knowledge' | 'meeting'): void {
    this.activeTab = tab;

    if (tab === 'knowledge' && this.knowledgeSubTab === 'sales' && this.canViewSalesTabs && !this.knowledgeSalesLoaded) {
      this.loadSalesKnowledgeOrders(this.currentSalesPage);
    }

    if (tab === 'meeting' && this.meetingSubTab === 'sales' && this.canViewSalesTabs && !this.meetingSalesLoaded) {
      this.loadSalesMeetingOrders(this.currentMeetingSalesPage);
    }
  }

  setKnowledgeSubTab(tab: 'purchased' | 'sales'): void {
    this.knowledgeSubTab = tab;

    if (tab === 'sales' && this.canViewSalesTabs && !this.knowledgeSalesLoaded) {
      this.loadSalesKnowledgeOrders(this.currentSalesPage);
    }
  }

  setMeetingSubTab(tab: 'purchased' | 'sales'): void {
    this.meetingSubTab = tab;

    if (tab === 'sales' && this.canViewSalesTabs && !this.meetingSalesLoaded) {
      this.loadSalesMeetingOrders(this.currentMeetingSalesPage);
    }
  }

  loadOrders(page: number = 1): void {
    this.currentPage = page;
    this.myOrdersService.getOrders(page).pipe(
      catchError((error) => {
        this.handleServerErrors(error);
        return of({
          data: [],
          links: { first: '', last: '', prev: null, next: null },
          meta: { current_page: 1, from: 0, last_page: 1, links: [], path: '', per_page: 10, to: 0, total: 0 }
        } as OrdersResponse);
      })
    ).subscribe(response => {
      this.orders$ = of(response.data);
      this.totalPages$ = of(response.meta.last_page);
    });
  }

  loadMeetingOrders(page: number = 1): void {
    this.currentMeetingPage = page;
    this.myOrdersService.getMeetingOrders(page).pipe(
      catchError((error) => {
        this.handleServerErrors(error);
        return of({
          data: [],
          links: { first: '', last: '', prev: null, next: null },
          meta: { current_page: 1, from: 0, last_page: 1, links: [], path: '', per_page: 10, to: 0, total: 0 }
        } as OrdersResponse);
      })
    ).subscribe(response => {
      this.meetingOrders$ = of(response.data);
      this.meetingTotalPages$ = of(response.meta.last_page);
    });
  }

  onPageChange(page: number): void {
    this.loadOrders(page);
  }

  onMeetingPageChange(page: number): void {
    this.loadMeetingOrders(page);
  }

  onSalesPageChange(page: number): void {
    this.loadSalesKnowledgeOrders(page);
  }

  onMeetingSalesPageChange(page: number): void {
    this.loadSalesMeetingOrders(page);
  }

  openOrderDetails(order: Order): void {
    this.selectedOrder = order;
    this.showOrderDetails = true;
  }

  openMeetingOrderDetails(order: Order): void {
    this.selectedMeetingOrder = order;
    this.showMeetingOrderDetails = true;
  }

  copyOrderNo(orderNo: string): void {
    navigator.clipboard.writeText(orderNo).then(() => {
      this.showSuccess(
        this.lang === 'ar' ? 'تم النسخ' : 'Copied',
        this.lang === 'ar' ? 'تم نسخ رقم الطلب' : 'Order number copied to clipboard'
      );
    }).catch(() => {
      this.showError(
        this.lang === 'ar' ? 'خطأ' : 'Error',
        this.lang === 'ar' ? 'فشل في نسخ رقم الطلب' : 'Failed to copy order number'
      );
    });
  }

  getFileIconByExtension(fileExtension: string): string {
    const iconMap: { [key: string]: string } = {
      pdf: './assets/media/svg/new-files/pdf.svg',
      doc: './assets/media/svg/new-files/doc.svg',
      docx: './assets/media/svg/new-files/docx.svg',
      xls: './assets/media/svg/new-files/xls.svg',
      xlsx: './assets/media/svg/new-files/xlsx.svg',
      ppt: './assets/media/svg/new-files/ppt.svg',
      pptx: './assets/media/svg/new-files/pptx.svg',
      txt: './assets/media/svg/new-files/txt.svg',
      zip: './assets/media/svg/new-files/zip.svg',
      rar: './assets/media/svg/new-files/zip.svg'
    };
    
    return iconMap[fileExtension.toLowerCase()] || './assets/media/svg/new-files/file.svg';
  }

  getBadgeColorByExtension(fileExtension: string): string {
    const colorMap: { [key: string]: string } = {
      csv: '#28a745',
      doc: '#0d6efd',
      docx: '#0d6efd',
      jpg: '#28a745',
      jpeg: '#28a745',
      png: '#28a745',
      gif: '#28a745',
      mp3: '#dc3545',
      mp4: '#6f42c1',
      pdf: '#dc3545',
      ppt: '#dc3545',
      pptx: '#dc3545',
      pub: '#dc3545',
      txt: '#0d6efd',
      xls: '#28a745',
      xlsx: '#28a745',
      zip: '#dc3545',
      rar: '#dc3545'
    };
    
    return colorMap[fileExtension.toLowerCase()] || '#6c757d';
  }


  private resolveSalesRole(): 'company' | 'insighter' | null {
    if (this.roles.includes('company') || this.roles.includes('company-insighter')) {
      return 'company';
    }

    if (this.roles.includes('insighter')) {
      return 'insighter';
    }

    return null;
  }

  private loadSalesKnowledgeOrders(page: number = 1): void {
    const role = this.resolveSalesRole();

    if (!role) {
      if (this.rolesLoaded) {
        this.salesOrders$ = of([]);
        this.salesTotalPages$ = of(0);
      }
      return;
    }

    this.currentSalesPage = page;
    this.myOrdersService.getSalesKnowledgeOrders(page, role, this.selectedInsighterUuid || undefined).pipe(
      catchError((error) => {
        this.handleServerErrors(error);
        return of({
          data: [],
          links: { first: '', last: '', prev: null, next: null },
          meta: { current_page: 1, from: 0, last_page: 1, links: [], path: '', per_page: 10, to: 0, total: 0 }
        } as OrdersResponse);
      })
    ).subscribe(response => {
      this.salesOrders$ = of(response.data);
      this.salesTotalPages$ = of(response.meta.last_page);
      this.knowledgeSalesLoaded = true;
    });
  }

  private loadSalesMeetingOrders(page: number = 1): void {
    const role = this.resolveSalesRole();

    if (!role) {
      if (this.rolesLoaded) {
        this.meetingSalesOrders$ = of([]);
        this.meetingSalesTotalPages$ = of(0);
      }
      return;
    }

    this.currentMeetingSalesPage = page;
    this.myOrdersService.getSalesMeetingOrders(page, role, this.selectedInsighterUuid || undefined).pipe(
      catchError((error) => {
        this.handleServerErrors(error);
        return of({
          data: [],
          links: { first: '', last: '', prev: null, next: null },
          meta: { current_page: 1, from: 0, last_page: 1, links: [], path: '', per_page: 10, to: 0, total: 0 }
        } as OrdersResponse);
      })
    ).subscribe(response => {
      this.meetingSalesOrders$ = of(response.data);
      this.meetingSalesTotalPages$ = of(response.meta.last_page);
      this.meetingSalesLoaded = true;
    });
  }

  navigateToDownloads(order: Order): void {
    const knowledgeDownloadId = order.knowledge_download_id;

    if (knowledgeDownloadId) {
      // Navigate with single UUID as query parameter
      this.router.navigate(['/app/insighter-dashboard/my-downloads'], {
        queryParams: { uuids: knowledgeDownloadId }
      });
    } else {
      this.showError(
        this.lang === 'ar' ? 'خطأ' : 'Error',
        this.lang === 'ar' ? 'لم يتم العثور على معرف التحميل' : 'Download ID not found'
      );
    }
  }

  downloadInvoice(order: Order): void {
    // Open invoice in a new tab
    const orderNumber = order.invoice_no || order.order_no;
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/app/invoice', orderNumber])
    );
    window.open(url, '_blank');
  }

  onInsighterFilterChange(insighterUuid: string | null): void {
    this.selectedInsighterUuid = insighterUuid;

    // Reset page to 1 when filtering
    this.currentSalesPage = 1;
    this.currentMeetingSalesPage = 1;

    // Reload sales data with new filter
    if (this.knowledgeSubTab === 'sales' && this.canViewSalesTabs) {
      this.knowledgeSalesLoaded = false;
      this.loadSalesKnowledgeOrders(1);
    }

    if (this.meetingSubTab === 'sales' && this.canViewSalesTabs) {
      this.meetingSalesLoaded = false;
      this.loadSalesMeetingOrders(1);
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
