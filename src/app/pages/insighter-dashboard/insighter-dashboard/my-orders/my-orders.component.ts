import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BaseComponent } from 'src/app/modules/base.component';
import { MyOrdersService, Order, OrdersResponse, SubOrder, KnowledgeDocument } from './my-orders.service';
import { Observable, catchError, map, of, forkJoin } from 'rxjs';
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
  private knowledgeSalesLoaded = false;
  private meetingSalesLoaded = false;
  private rolesLoaded = false;
  constructor(
    injector: Injector,
    private myOrdersService: MyOrdersService,
    private router: Router,
    private sanitizer: DomSanitizer,
    private proile:ProfileService
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
    return this.resolveSalesRole() !== null;
  }

  ngOnInit(): void {
    this.getRoles();
    this.loadOrders();
    this.loadMeetingOrders();
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

  getKnowledgeUrl(knowledge: any): string {
    if (knowledge.slug) {
      return `https://knoldg.com/en/knowledge/data/${knowledge.slug}`;
    }
    return '#';
  }

  getStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'badge badge-light-success';
      case 'pending':
        return 'badge badge-light-warning';
      case 'failed':
        return 'badge badge-light-danger';
      default:
        return 'badge badge-light-info';
    }
  }

  getServiceTypeDisplay(service: string): string {
    if (service === 'knowledge_service') {
      return 'Knowledge';
    }
    if (service === 'meeting_service') {
      return 'Meeting';
    }
    return service.replace(/_/g, ' ').split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  getMeetingStatusBadgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'completed':
        return 'badge-light-success';
      case 'pending':
        return 'badge-light-warning';
      case 'cancelled':
        return 'badge-light-danger';
      default:
        return 'badge-light-info';
    }
  }

  getMeetingStatusDisplay(status: string): string {
    const statusMap: { [key: string]: { ar: string; en: string } } = {
      'pending': { ar: 'قيد الانتظار', en: 'Pending' },
      'confirmed': { ar: 'مؤكد', en: 'Confirmed' },
      'completed': { ar: 'مكتمل', en: 'Completed' },
      'cancelled': { ar: 'ملغى', en: 'Cancelled' }
    };
    
    const statusKey = status.toLowerCase();
    const langKey = this.lang as 'ar' | 'en';
    return statusMap[statusKey] ? statusMap[statusKey][langKey] : status;
  }

  getOrderStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'text-success';
      case 'pending':
        return 'text-warning';
      case 'failed':
        return 'text-danger';
      default:
        return 'text-info';
    }
  }

  calculateDuration(startTime: string | undefined, endTime: string | undefined): string {
    if (!startTime || !endTime) {
      return this.lang === 'ar' ? 'غير محدد' : 'Not specified';
    }

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diff = end.getTime() - start.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    if (hours > 0 && minutes > 0) {
      return this.lang === 'ar' ? `${hours} ساعة و ${minutes} دقيقة` : `${hours}h ${minutes}min`;
    } else if (hours > 0) {
      return this.lang === 'ar' ? `${hours} ساعة` : `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return this.lang === 'ar' ? `${minutes} دقيقة` : `${minutes} minutes`;
    }
  }

  getPaymentMethodDisplay(payment: any): string {
    if (!payment) {
      return this.lang === 'ar' ? 'غير محدد' : 'Not specified';
    }

    // Handle card payments with beautiful formatting
    if (payment.method === 'provider' && payment.provider_payment_method_type === 'card') {
      const cardBrand = this.getCardBrandName(payment.provider_card_brand);
      const lastFour = payment.provider_card_last_number;

      if (cardBrand && lastFour) {
        return `${cardBrand} •••• ${lastFour}`;
      }
    }

    // Handle wallet payments
    if (payment.method === 'manual') {
      return this.lang === 'ar' ? 'محفظة نولدج' : 'Knoldg Wallet';
    }

    // Handle other payment methods
    if (payment.method === 'provider' && payment.provider) {
      const provider = payment.provider.charAt(0).toUpperCase() + payment.provider.slice(1).toLowerCase();
      return provider;
    }

    const method = payment.method?.charAt(0).toUpperCase() + payment.method?.slice(1).toLowerCase();
    return method || (this.lang === 'ar' ? 'غير محدد' : 'Not specified');
  }

  getCardBrandName(brand: string): string {
    if (!brand) return '';

    const brandMap: { [key: string]: string } = {
      'visa': 'Visa',
      'mastercard': 'Mastercard',
      'amex': 'American Express',
      'discover': 'Discover',
      'diners': 'Diners Club',
      'jcb': 'JCB',
      'unionpay': 'UnionPay'
    };

    return brandMap[brand.toLowerCase()] || brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
  }

  getPaymentMethodIcon(payment: any): string {
    if (!payment) {
      return 'ki-outline ki-questionnaire-tablet';
    }

    // Handle card payments with specific brand icons
    if (payment.method === 'provider' && payment.provider_payment_method_type === 'card') {
      const cardBrand = payment.provider_card_brand?.toLowerCase();
      const cardIconMap: { [key: string]: string } = {
        'visa': 'ki-outline ki-credit-cart',
        'mastercard': 'ki-outline ki-credit-cart',
        'amex': 'ki-outline ki-credit-cart',
        'discover': 'ki-outline ki-credit-cart',
        'diners': 'ki-outline ki-credit-cart',
        'jcb': 'ki-outline ki-credit-cart',
        'unionpay': 'ki-outline ki-credit-cart'
      };

      return cardIconMap[cardBrand] || 'ki-outline ki-credit-cart';
    }

    // Handle wallet payments
    if (payment.method === 'manual') {
      return 'ki-outline ki-wallet';
    }

    // Handle other provider payments
    if (payment.method === 'provider') {
      return 'ki-outline ki-bank';
    }

    // Default icon
    return 'ki-outline ki-questionnaire-tablet';
  }

  shouldShowCardLogo(payment: any): boolean {
    if (!payment || payment.method !== 'provider' || payment.provider_payment_method_type !== 'card') {
      return false;
    }

    const cardBrand = payment.provider_card_brand?.toLowerCase();
    return cardBrand === 'visa' || cardBrand === 'mastercard';
  }

  getCardLogoSvg(payment: any): SafeHtml {
    if (!payment || payment.method !== 'provider' || payment.provider_payment_method_type !== 'card') {
      return '';
    }

    const cardBrand = payment.provider_card_brand?.toLowerCase();

    if (cardBrand === 'visa') {
      const svgContent = `<svg width="24" height="16" viewBox="0 0 79 25" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M23.112 0.562331L16.3411 16.9637L13.7044 2.96786C13.5091 1.65575 12.4023 0.531091 10.8724 0.531091H0V1.28087C2.24609 1.65575 4.32943 2.40553 6.1849 3.34275C6.93359 3.71763 7.45443 4.49865 7.68229 5.40463L12.7604 24.8051H19.5312L29.6875 0.562331H23.112Z" fill="#172B85"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M32.2917 0.562331L27.0508 24.8051H33.431L38.7044 0.562331H32.2917Z" fill="#172B85"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M46.9401 7.27907C47.1354 5.96696 48.2422 5.21718 49.5768 5.21718C51.6276 5.02974 53.9062 5.40463 55.7617 6.34185L56.901 1.12466C55.013 0.374888 52.9622 0 51.0742 0C44.8893 0 40.3646 3.34275 40.3646 8.02884C40.3646 11.559 43.5547 13.4335 45.8008 14.5581C48.2422 15.6828 49.1862 16.4326 48.9909 17.526C48.9909 19.213 47.1029 19.9628 45.2474 19.9628C43.0013 19.9628 40.7227 19.4004 38.6719 18.4632L37.5326 23.6804C39.8112 24.6176 42.2526 24.9925 44.4987 24.9925C51.4323 25.1799 55.7617 21.8372 55.7617 16.7762C55.7943 10.4344 46.9401 10.0595 46.9401 7.27907Z" fill="#172B85"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M73.0469 0.562331H67.6107C66.4714 0.562331 65.3646 1.31211 64.974 2.43677L55.599 24.8051H62.1745L63.4766 21.2749H71.5495L72.2982 24.8051H78.125L73.0469 0.562331ZM65.1693 16.2139L68.5547 7.09162L70.4427 16.2139H65.1693Z" fill="#172B85"/>
      </svg>`;
      return this.sanitizer.bypassSecurityTrustHtml(svgContent);
    }

    if (cardBrand === 'mastercard') {
      const svgContent = `<svg width="24" height="16" viewBox="0 0 63 38" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="43.75" cy="18.75" r="18.75" fill="#F9A000"/>
        <circle cx="18.75" cy="18.75" r="18.75" fill="#ED0006"/>
      </svg>`;
      return this.sanitizer.bypassSecurityTrustHtml(svgContent);
    }

    return '';
  }


  getDocumentCountByExtension(suborder: SubOrder, extension: string): number {
    let count = 0;
    suborder.knowledge_documents?.forEach((docGroup: KnowledgeDocument[]) => {
      docGroup.forEach((doc: KnowledgeDocument) => {
        if (doc.file_extension.toLowerCase() === extension.toLowerCase()) {
          count++;
        }
      });
    });
    return count;
  }

  getUniqueExtensions(suborder: SubOrder): string[] {
    const extensions = new Set<string>();
    suborder.knowledge_documents?.forEach((docGroup: KnowledgeDocument[]) => {
      docGroup.forEach((doc: KnowledgeDocument) => {
        extensions.add(doc.file_extension.toLowerCase());
      });
    });
    return Array.from(extensions);
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
    this.myOrdersService.getSalesKnowledgeOrders(page, role).pipe(
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
    this.myOrdersService.getSalesMeetingOrders(page, role).pipe(
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
