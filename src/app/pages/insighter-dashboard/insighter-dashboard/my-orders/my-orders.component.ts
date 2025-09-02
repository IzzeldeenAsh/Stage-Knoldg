import { ChangeDetectionStrategy, Component, Injector, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BaseComponent } from 'src/app/modules/base.component';
import { MyOrdersService, Order, OrdersResponse, SubOrder, KnowledgeDocument } from './my-orders.service';
import { Observable, catchError, map, of } from 'rxjs';

@Component({
  selector: 'app-my-orders',
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyOrdersComponent extends BaseComponent implements OnInit {
  orders$: Observable<Order[]> = of([]);
  totalPages$: Observable<number> = of(0);
  currentPage = 1;
  selectedOrder: Order | null = null;
  showOrderDetails = false;

  constructor(
    injector: Injector,
    private myOrdersService: MyOrdersService,
    private router: Router
  ) {
    super(injector);
  }

  get isLoading$() {
    return this.myOrdersService.isLoading$;
  }

  ngOnInit(): void {
    this.loadOrders();
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

  onPageChange(page: number): void {
    this.loadOrders(page);
  }

  openOrderDetails(order: Order): void {
    this.selectedOrder = order;
    this.showOrderDetails = true;
  }

  copyOrderUuid(uuid: string): void {
    navigator.clipboard.writeText(uuid).then(() => {
      this.showSuccess(
        this.lang === 'ar' ? 'تم النسخ' : 'Copied',
        this.lang === 'ar' ? 'تم نسخ رقم الطلب' : 'Order UUID copied to clipboard'
      );
    }).catch(() => {
      this.showError(
        this.lang === 'ar' ? 'خطأ' : 'Error',
        this.lang === 'ar' ? 'فشل في نسخ رقم الطلب' : 'Failed to copy order UUID'
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

  navigateToDownloads(knowledgeTitle: string): void {
    this.router.navigate(['/app/insighter-dashboard/my-downloads'], {
      queryParams: { search: knowledgeTitle }
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