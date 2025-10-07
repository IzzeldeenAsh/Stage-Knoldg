import { Injectable } from '@angular/core';
import { Order, KnowledgeDocument } from './my-orders.service';

@Injectable({
  providedIn: 'root'
})
export class InvoiceGeneratorService {

  constructor() { }

  generateInvoice(order: Order, userProfile: any): string {
    console.log('Order', order)
    const invoiceDate = new Date(order.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });

    // Check if this is a meeting order or knowledge order
    const isMeetingOrder = order.service === 'meeting_service';
    let serviceRows = '';
    let subtotal = order.amount;

    if (isMeetingOrder) {
      // Handle meeting orders
      const meetingItems: Array<{name: string, price: number}> = [];

      if (order.orderable?.meeting_booking) {
        const meeting = order.orderable.meeting_booking;
        meetingItems.push({
          name: `Meeting: ${meeting.title} - ${meeting.date} (${meeting.start_time} - ${meeting.end_time})`,
          price: order.amount
        });
      }

      serviceRows = meetingItems.map(item => `
        <div class="service-row">
          <span class="service-name">${item.name}</span>
          <span class="service-amount">$${item.price.toFixed(2)}</span>
        </div>
      `).join('');
    } else {
      // Handle knowledge orders
      const allDocuments: Array<{name: string, price: number}> = [];
      subtotal = 0;

      if (order.orderable?.knowledge_documents) {
        order.orderable.knowledge_documents.forEach(docGroup => {
          docGroup.forEach((doc: KnowledgeDocument) => {
            allDocuments.push({
              name: doc.file_name,
              price: doc.price
            });
            subtotal += doc.price;
          });
        });
      }

      // Generate service rows for documents
      serviceRows = allDocuments.map(doc => `
        <div class="service-row">
          <span class="service-name">${doc.name}</span>
          <span class="service-amount">$${doc.price.toFixed(2)}</span>
        </div>
      `).join('');
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - KNOLDG Business</title>
        <style>
            @page{
                size: A4;
                margin: 10mm;
                padding: 0;
            }

            @media print {
                html, body {
                    height: 100%;
                    overflow: hidden;
                }

                .invoice-container {
                    page-break-after: avoid;
                    page-break-inside: avoid;
                }
            }

            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family:Arial, Helvetica, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                margin: 0;
                min-height: 100vh;
                overflow: hidden;
            }

            .invoice-container {
                background: white;
                width: 190mm;
                height: 277mm;
                max-height: 277mm;
                position: relative;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            .header {
                background: linear-gradient(90deg, #042043 0%, #57B6C7 100%);
                padding: 25px;
                position: relative;
                overflow: hidden;
            }


            .header h1 {
                color: white;
                font-size: 36px;
                text-align: center;
                font-weight: 600;
                position: relative;
                z-index: 1;
                margin: 0;
            }

            .content {
                padding: 40px 40px;
                flex: 1;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
            }

            .logo-section {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 40px;
            }

            .logo-container {
                display: flex;
                align-items: center;
                gap: 12px;
            }

            .logo {
                width: 160px;
            }

            .company-name {
                font-size: 24px;
                font-weight: 600;
                color: #042043;
                display: flex;
                flex-direction: column;
                line-height: 1.2;
            }

            .company-name .business {
                font-size: 16px;
                font-weight: 400;
                color: #57B6C7;
            }

            .invoice-info {
                text-align: right;
                color: #666;
                font-size: 13px;
                line-height: 1.6;
            }

            .invoice-info strong {
                color: #333;
            }

            .billing-section {
                display: flex;
                justify-content: space-between;
                margin-bottom: 40px;
                gap: 60px;
            }

            .from-section, .bill-to-section {
                flex: 1;
            }

            .section-title {
                font-size: 18px;
                font-weight: 600;
                color: #042043;
                margin-bottom: 15px;
            }

            .from-section p, .bill-to-section p {
                color: #333;
                line-height: 1.8;
                font-size: 15px;
            }

            .bill-to-section .label {
                display: inline-block;
                font-weight: 600;
                color: #042043;
                min-width: 80px;
            }

            .services-table {
                margin-bottom: 40px;
            }

            .table-header {
                display: flex;
                justify-content: space-between;
                padding: 15px 0;
                border-bottom: 2px solid #e0e0e0;
                margin-bottom: 20px;
            }

            .table-header h3 {
                font-size: 18px;
                font-weight: 600;
                color: #042043;
            }

            .service-row {
                display: flex;
                justify-content: space-between;
                padding: 15px 0;
                border-bottom: 1px solid #f0f0f0;
            }

            .service-name {
                color: #333;
                font-size: 15px;
            }

            .service-amount {
                color: #333;
                font-size: 15px;
            }

            .totals-section {
                margin-top: 40px;
                margin-bottom: 40px;
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 15px;
            }

            .subtotal, .total {
                display: flex;
                align-items: center;
                gap: 30px;
                font-size: 18px;
            }

            .subtotal {
                color: #666;
            }

            .total {
                font-weight: 600;
                color: #042043;
            }

            .total .amount {
                background: linear-gradient(90deg, #042043 0%, #57B6C7 100%);
                color: white;
                padding: 10px 20px;
                border-radius: 4px;
                min-width: 120px;
                text-align: center;
            }

            .footer {
                padding: 30px;
                text-align: center;
                color: #999;
                font-size: 14px;
                border-top: 1px solid #f0f0f0;
            }
            .bg{
                background-image: url(https://res.cloudinary.com/dsiku9ipv/image/upload/v1758005640/invoice_template_knoldg_0_1_naflvj.png);
    position: absolute;
    top: 130px;
    left: 50%;
    transform: translate(-50%, -50%);
    background-repeat: no-repeat;
    z-index: 10;
    background-position: center;
    height: 100%;
    width: 680px;
    opacity: 0.1;
            }
        </style>
</head>
<body>

    <div class="invoice-container">
        <div class="bg"></div>
        <div class="header">
            <h1>INVOICE</h1>
        </div>

        <div class="content">
            <div class="logo-section">
                <div class="logo-container">
                    <img src="https://res.cloudinary.com/dsiku9ipv/image/upload/v1758006879/invoice_template_knoldg_0_2_aeurma.png" alt="KNOLDG Logo" class="logo">
                </div>
                <div class="invoice-info">
                    ${order.invoice_no || order.order_no}<br>
                    ${invoiceDate}
                </div>
            </div>

            <div class="billing-section">
                <div class="from-section">
                    <h3 class="section-title">From:</h3>
                    <p>
                       Foresighta Systems Consulting FZ-LLC<br>
Compass Building Al Shohada Road AL Hamra Industrial<br>
Zone-FZ<br>
Ras Al Khaimah United Arab Emirates<br>
info@knoldg.com
                    </p>
                </div>

                <div class="bill-to-section">
                    <h3 class="section-title">Bill To:</h3>
                    <p>
                        <span class="label">Name:</span> ${userProfile?.name || 'Client Name'}<br>
                        <span class="label">Email:</span> ${userProfile?.email || 'client@email.com'}<br>
                        <span class="label">Country:</span> ${userProfile?.billing_address || 'N/A'}
                    </p>
                </div>
            </div>

            <div class="services-table">
                <div class="table-header">
                    <h3>Service type</h3>
                    <h3>Amount</h3>
                </div>

                ${serviceRows}
            </div>

            <div class="totals-section">
               
                <div class="total">
                    <span>Total:</span>
                    <span class="amount">$${order.amount.toFixed(2)}</span>
                </div>
            </div>
        </div>

        <div class="footer">
            Thank you for your business © 2025 knoldg | info&#64;knoldg.com
        </div>
    </div>
</body>
</html>`;
  }

  downloadInvoiceAsPDF(htmlContent: string, filename: string): void {
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load, then trigger print dialog
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
    }
  }

  openInvoiceInNewTab(htmlContent: string): void {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');
    if (newWindow) {
      newWindow.onload = () => {
        // Auto-trigger print dialog after content loads
        setTimeout(() => {
          newWindow.focus();
          newWindow.print();
        }, 500);
        window.URL.revokeObjectURL(url);
      };
    }
  }
}