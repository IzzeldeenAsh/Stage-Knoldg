import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponent } from 'src/app/modules/base.component';
import { MyOrdersService, Order, OrdersResponse, SubOrder, KnowledgeDocument } from './my-orders.service';
import { Observable, catchError, map, of, forkJoin } from 'rxjs';
import { InvoiceGeneratorService } from './invoice-generator.service';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';

@Component({
  selector: 'app-my-orders',
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyOrdersComponent extends BaseComponent implements OnInit {
  activeTab: 'knowledge' | 'meeting' = 'knowledge';
  
  orders$: Observable<Order[]> = of([]);
  totalPages$: Observable<number> = of(0);
  currentPage = 1;
  selectedOrder: Order | null = null;
  showOrderDetails = false;

  meetingOrders$: Observable<Order[]> = of([]);
  meetingTotalPages$: Observable<number> = of(0);
  currentMeetingPage = 1;
  selectedMeetingOrder: Order | null = null;
  showMeetingOrderDetails = false;

  constructor(
    injector: Injector,
    private myOrdersService: MyOrdersService,
    private router: Router,
    private invoiceGeneratorService: InvoiceGeneratorService,
    private profileService: ProfileService
  ) {
    super(injector);
  }

  get isLoading$() {
    return this.myOrdersService.isLoading$;
  }

  get isMeetingLoading$() {
    return this.myOrdersService.isMeetingLoading$;
  }

  ngOnInit(): void {
    this.loadOrders();
    this.loadMeetingOrders();
  }

  setActiveTab(tab: 'knowledge' | 'meeting'): void {
    this.activeTab = tab;
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

  calculateDuration(startTime: string, endTime: string): string {
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
    
    const method = payment.method?.charAt(0).toUpperCase() + payment.method?.slice(1).toLowerCase();
    const provider = payment.provider?.charAt(0).toUpperCase() + payment.provider?.slice(1).toLowerCase();
    
    if (payment.method === 'provider' && payment.provider) {
      return provider;
    }
    
    return method || (this.lang === 'ar' ? 'غير محدد' : 'Not specified');
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

  navigateToDownloads(order: Order, suborderIndex: number): void {
    const knowledgeDownloadIds = order.knowledge_download_ids || [];
    
    if (knowledgeDownloadIds.length > 0) {
      // Navigate with all UUIDs as comma-separated query parameter
      this.router.navigate(['/app/insighter-dashboard/my-downloads'], {
        queryParams: { uuids: knowledgeDownloadIds.join(',') }
      });
    } else {
      this.showError(
        this.lang === 'ar' ? 'خطأ' : 'Error',
        this.lang === 'ar' ? 'لم يتم العثور على معرفات التحميل' : 'Download IDs not found'
      );
    }
  }

  downloadInvoice(order: Order): void {
    // Get user profile and generate invoice
    this.profileService.getProfile().pipe(
      catchError((error) => {
        this.handleServerErrors(error);
        return of(null);
      })
    ).subscribe(userProfile => {
      try {
        // Generate invoice HTML
        const invoiceHtml = this.invoiceGeneratorService.generateInvoice(order, userProfile);
        
        // Generate filename
        const filename = `invoice-${order.invoice_no || order.order_no}.pdf`;
        
        // Open invoice in new tab for viewing and potential PDF download
        this.invoiceGeneratorService.openInvoiceInNewTab(invoiceHtml);
        
        this.showSuccess(
          this.lang === 'ar' ? 'تم إنشاء الفاتورة' : 'Invoice Generated',
          this.lang === 'ar' ? 'تم فتح الفاتورة في نافذة جديدة. يمكنك طباعتها أو حفظها كـ PDF من المتصفح' : 'Invoice opened in new tab. You can print or save as PDF from the browser'
        );
      } catch (error) {
        console.error('Error generating invoice:', error);
        this.showError(
          this.lang === 'ar' ? 'خطأ' : 'Error',
          this.lang === 'ar' ? 'فشل في إنشاء الفاتورة' : 'Failed to generate invoice'
        );
      }
    });
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