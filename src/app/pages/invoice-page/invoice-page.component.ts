import { Component, OnInit, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponent } from 'src/app/modules/base.component';
import { MyOrdersService, OrdersResponse, Order } from '../insighter-dashboard/insighter-dashboard/my-orders/my-orders.service';
import { ProfileService } from 'src/app/_fake/services/get-profile/get-profile.service';
import { InvoiceData } from 'src/app/reusable-components/invoice-viewer/invoice-viewer.component';
import { forkJoin, catchError, of, Observable } from 'rxjs';

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
        const isClient = userRoles.length === 1 && userRoles[0] === 'client';
        const salesRole: 'company' | 'insighter' = isCompany ? 'company' : 'insighter';
        //
        // Load order data from all sources
        // Clients don't have access to sales orders, so conditionally include them
        type OrderSources = {
          orders: Observable<OrdersResponse>;
          meetingOrders: Observable<OrdersResponse>;
          salesKnowledgeOrders?: Observable<OrdersResponse>;
          salesMeetingOrders?: Observable<OrdersResponse>;
        };

        // Create a fallback empty OrdersResponse
        const emptyOrdersResponse: OrdersResponse = {
          data: [],
          links: {
            first: '',
            last: '',
            prev: null,
            next: null
          },
          meta: {
            current_page: 1,
            from: 0,
            last_page: 1,
            links: [],
            path: '',
            per_page: 5,
            to: 0,
            total: 0
          }
        };

        const orderSources: OrderSources = {
          orders: this.myOrdersService.getOrders(1).pipe(
            catchError(() => of(emptyOrdersResponse))
          ),
          meetingOrders: this.myOrdersService.getMeetingOrders(1).pipe(
            catchError(() => of(emptyOrdersResponse))
          )
        };

        // Only include sales orders if user is not a client
        if (!isClient) {
          orderSources.salesKnowledgeOrders = this.myOrdersService.getSalesKnowledgeOrders(1, salesRole).pipe(
            catchError(() => of(emptyOrdersResponse))
          );
          orderSources.salesMeetingOrders = this.myOrdersService.getSalesMeetingOrders(1, salesRole).pipe(
            catchError(() => of(emptyOrdersResponse))
          );
        }

        forkJoin(orderSources).subscribe({
          next: (result) => {
            const orders = result.orders;
            const meetingOrders = result.meetingOrders;
            const salesKnowledgeOrders = result.salesKnowledgeOrders || emptyOrdersResponse;
            const salesMeetingOrders = result.salesMeetingOrders || emptyOrdersResponse;

            // Find the order by order number in all order types
            let foundOrder: Order | undefined = orders.data.find((order: Order) =>
              order.order_no === orderNo || order.invoice_no === orderNo
            );

            if (!foundOrder) {
              foundOrder = meetingOrders.data.find((order: Order) =>
                order.order_no === orderNo || order.invoice_no === orderNo
              );
            }

            if (!foundOrder && !isClient) {
              foundOrder = salesKnowledgeOrders.data.find((order: Order) =>
                order.order_no === orderNo || order.invoice_no === orderNo
              );
            }

            if (!foundOrder && !isClient) {
              foundOrder = salesMeetingOrders.data.find((order: Order) =>
                order.order_no === orderNo || order.invoice_no === orderNo
              );
            }

            if (foundOrder) {
              // Determine if this is a purchased order (current user bought it) or sold order (current user sold it)
              const isPurchasedOrder = orders.data.some((o: Order) => o.uuid === foundOrder!.uuid) || meetingOrders.data.some((o: Order) => o.uuid === foundOrder!.uuid);
              const isSoldOrder = !isClient && (salesKnowledgeOrders.data.some((o: Order) => o.uuid === foundOrder!.uuid) || salesMeetingOrders.data.some((o: Order) => o.uuid === foundOrder!.uuid));

              let billToProfile: {
                first_name: string;
                last_name: string;
                name: string;
                email: string;
                country: string;
              } | undefined = undefined;
              let billingAddress: string | null = null;

              if (isPurchasedOrder) {
                // For purchased orders, bill-to should be the current logged-in user
                billToProfile = {
                  first_name: userProfile?.first_name || '',
                  last_name: userProfile?.last_name || '',
                  name: userProfile?.name || '',
                  email: userProfile?.email || '',
                  country: ''
                };
                // billing_address is a string, use it directly (not an object)
                const billingAddr = foundOrder.payment?.billing_address;
                billingAddress = typeof billingAddr === 'string' && billingAddr !== '' 
                  ? billingAddr 
                  : null;
              } else if (isSoldOrder) {
                // For sold orders, bill-to should be the buyer (user object in the order)
                billToProfile = {
                  first_name: foundOrder.user?.first_name || '',
                  last_name: foundOrder.user?.last_name || '',
                  name: foundOrder.user?.name || '',
                  email: foundOrder.user?.email || '',
                  country: ''
                };
                // billing_address is a string, use it directly (not an object)
                const billingAddr = foundOrder.payment?.billing_address;
                billingAddress = typeof billingAddr === 'string' && billingAddr !== '' 
                  ? billingAddr 
                  : null;
              }

              this.invoiceData = {
                order_no: foundOrder.order_no,
                invoice_no: foundOrder.invoice_no,
                date: foundOrder.date,
                amount: foundOrder.amount,
                service: foundOrder.service,
                orderable: foundOrder.orderable,
                userProfile: billToProfile,
                billingAddress: billingAddress
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