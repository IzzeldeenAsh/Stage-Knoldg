import { Injectable } from '@angular/core';
import { Order, KnowledgeDocument } from './my-orders.service';

@Injectable({
  providedIn: 'root'
})
export class InvoiceGeneratorService {

  constructor() { }

  generateInvoice(order: Order, userProfile: any): string {
    const invoiceDate = new Date(order.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });

    // Extract all documents from suborders
    const allDocuments: Array<{name: string, price: number}> = [];
    let subtotal = 0;

    order.suborders.forEach(suborder => {
      suborder.knowledge_documents?.forEach(docGroup => {
        docGroup.forEach((doc: KnowledgeDocument) => {
          allDocuments.push({
            name: doc.file_name,
            price: doc.price
          });
          subtotal += doc.price;
        });
      });
    });

    // Generate table rows for documents
    const documentRows = allDocuments.map(doc => `
      <tr>
        <td>${doc.name}</td>
        <td class="amount">$${doc.price.toFixed(2)}</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice #${order.invoice_no || order.order_no}</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 15mm;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: white;
            margin: 0;
            padding: 0;
        }
        
        .invoice {
            width: 210mm;
            height: 297mm;
            margin: 0 auto;
            padding: 15mm;
            background: white;
            position: relative;
            display: flex;
            flex-direction: column;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #3b82f6;
        }
        
        .logo img {
            height: 70px;
            max-width: 300px;
            object-fit: contain;
        }
        
        .invoice-info {
            text-align: right;
            font-size: 12px;
        }
        
        .invoice-info h1 {
            font-size: 24px;
            color: #2563eb;
            margin-bottom: 8px;
            font-weight: bold;
        }
        
        .status {
            background: #3b82f6;
            color: white;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            display: inline-block;
            margin-top: 5px;
        }
        
        .billing {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            font-size: 12px;
        }
        
        .billing div {
            width: 48%;
        }
        
        .billing h3 {
            font-size: 14px;
            margin-bottom: 10px;
            color: #1e40af;
            font-weight: bold;
        }
        
        .billing p {
            line-height: 1.6;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            font-size: 12px;
        }
        
        th {
            background: #eff6ff;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #3b82f6;
            color: #1e40af;
            font-size: 13px;
        }
        
        td {
            padding: 12px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .amount {
            text-align: right;
            font-weight: 600;
            color: #2563eb;
        }
        
        .totals {
            margin-left: auto;
            width: 250px;
            font-size: 12px;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
        }
        
        .final-total {
            border-top: 2px solid #2563eb;
            margin-top: 10px;
            padding-top: 10px;
            font-weight: bold;
            font-size: 14px;
            color: #1e40af;
        }
        
        .content-wrapper {
            flex: 1;
        }
        
        .footer {
            margin-top: auto;
            text-align: center;
            font-size: 11px;
            color: #666;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            position: absolute;
            bottom: 15mm;
            left: 15mm;
            right: 15mm;
        }
        
        @media screen {
            body {
                background: #f0f0f0;
                padding: 20px;
            }
        }
        
        @media print {
            body { 
                margin: 0;
                padding: 0;
                background: white;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            .invoice { 
                width: 100%;
                height: 100%;
                margin: 0;
                padding: 15mm;
                box-shadow: none;
                page-break-after: avoid;
            }
            .header {
                break-inside: avoid;
            }
            .billing {
                break-inside: avoid;
            }
            table {
                break-inside: avoid;
            }
            thead {
                display: table-header-group;
            }
            tr {
                break-inside: avoid;
            }
            .totals {
                break-inside: avoid;
            }
            .footer {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
            }
        }
    </style>
</head>
<body>
    <div class="invoice">
        <div class="content-wrapper">
            <div class="header">
                <div class="logo">
                    <img src="https://res.cloudinary.com/dsiku9ipv/image/upload/v1744785080/logos_-_KNOLDG-01_1_oxm7ks.png" alt="KNOLDG">
                </div>
                <div class="invoice-info">
                    <h1>INVOICE</h1>
                    <p>#${order.invoice_no || order.order_no}</p>
                    <p>${invoiceDate}</p>
                </div>
            </div>
            
            <div class="billing">
                <div>
                    <h3>Bill To:</h3>
                    <p>${userProfile?.name || 'Client Name'}<br>
                    ${userProfile?.email || 'client@email.com'}<br>
                    ${userProfile?.country || 'Country'}</p>
                </div>
                <div>
                    <h3>From:</h3>
                    <p>KNOLDG<br>
                    info@knoldg.com<br>
                    www.knoldg.com</p>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th style="width: 80px;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${documentRows}
                </tbody>
            </table>
            
            <div class="totals">
                <div class="total-row">
                    <span>Subtotal:</span>
                    <span>$${subtotal.toFixed(2)}</span>
                </div>
                <div class="total-row final-total">
                    <span>Total:</span>
                    <span>$${order.amount.toFixed(2)}</span>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Thank you for your business</p>
            <p style="margin-top: 10px;">&copy; 2025 Knoldg.com | info@knoldg.com</p>
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