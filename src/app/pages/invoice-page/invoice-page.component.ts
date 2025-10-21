import { Component, OnInit, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponent } from 'src/app/modules/base.component';
import { MyOrdersService } from '../insighter-dashboard/insighter-dashboard/my-orders/my-orders.service';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { InvoiceData } from 'src/app/reusable-components/invoice-viewer/invoice-viewer.component';
import { forkJoin, catchError, of } from 'rxjs';

@Component({
  selector: 'app-invoice-page',
  templateUrl: './invoice-page.component.html',
  styleUrls: ['./invoice-page.component.scss']
})
export class InvoicePageComponent extends BaseComponent implements OnInit {
  invoiceData: InvoiceData | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    injector: Injector,
    private route: ActivatedRoute,
    private router: Router,
    private myOrdersService: MyOrdersService,
    private profileService: ProfileService
  ) {
    super(injector);
  }

  ngOnInit(): void {
    const orderNo = this.route.snapshot.params['orderNo'];
    if (orderNo) {
      this.loadInvoiceData(orderNo);
    } else {
      this.error = this.lang === 'ar' ? 'رقم الطلب مطلوب' : 'Order number is required';
      this.isLoading = false;
    }
  }

  private loadInvoiceData(orderNo: string): void {
    this.isLoading = true;
    this.error = null;

    // First get user profile to determine role
    this.profileService.getProfile().subscribe({
      next: (userProfile) => {
        const userRoles = userProfile?.roles || [];
        const isCompany = userRoles.includes('company');
        const salesRole: 'company' | 'insighter' = isCompany ? 'company' : 'insighter';

        // Load order data from all sources
        forkJoin({
          orders: this.myOrdersService.getOrders(1).pipe(
            catchError(() => of({ data: [], meta: { last_page: 1 } }))
          ),
          meetingOrders: this.myOrdersService.getMeetingOrders(1).pipe(
            catchError(() => of({ data: [], meta: { last_page: 1 } }))
          ),
          salesKnowledgeOrders: this.myOrdersService.getSalesKnowledgeOrders(1, salesRole).pipe(
            catchError(() => of({ data: [], meta: { last_page: 1 } }))
          ),
          salesMeetingOrders: this.myOrdersService.getSalesMeetingOrders(1, salesRole).pipe(
            catchError(() => of({ data: [], meta: { last_page: 1 } }))
          )
        }).subscribe({
          next: ({ orders, meetingOrders, salesKnowledgeOrders, salesMeetingOrders }) => {
            // Find the order by order number in all order types
            let foundOrder = orders.data.find(order =>
              order.order_no === orderNo || order.invoice_no === orderNo
            );

            if (!foundOrder) {
              foundOrder = meetingOrders.data.find(order =>
                order.order_no === orderNo || order.invoice_no === orderNo
              );
            }

            if (!foundOrder) {
              foundOrder = salesKnowledgeOrders.data.find(order =>
                order.order_no === orderNo || order.invoice_no === orderNo
              );
            }

            if (!foundOrder) {
              foundOrder = salesMeetingOrders.data.find(order =>
                order.order_no === orderNo || order.invoice_no === orderNo
              );
            }

            if (foundOrder) {
              this.invoiceData = {
                order_no: foundOrder.order_no,
                invoice_no: foundOrder.invoice_no,
                date: foundOrder.date,
                amount: foundOrder.amount,
                service: foundOrder.service,
                orderable: foundOrder.orderable,
                userProfile: userProfile
              };
            } else {
              this.error = this.lang === 'ar' ? 'الطلب غير موجود' : 'Order not found';
            }

            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading invoice data:', error);
            this.error = this.lang === 'ar' ? 'خطأ في تحميل بيانات الفاتورة' : 'Error loading invoice data';
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        this.error = this.lang === 'ar' ? 'خطأ في تحميل بيانات المستخدم' : 'Error loading user profile';
        this.isLoading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/app/insighter-dashboard/my-orders']);
  }
}