import { Component, OnInit, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaseComponent } from 'src/app/modules/base.component';
import { FundService, InsighterWalletDetails } from 'src/app/_fake/services/fund.service';

@Component({
  selector: 'app-insighter-wallet-form',
  templateUrl: './insighter-wallet-form.component.html',
  styleUrls: ['./insighter-wallet-form.component.scss']
})
export class InsighterWalletFormComponent extends BaseComponent implements OnInit {
  insighterId: number = 0;
  insighterData: InsighterWalletDetails | null = null;
  isLoading: boolean = false;

  constructor(
    injector: Injector,
    private route: ActivatedRoute,
    private router: Router,
    private fundService: FundService
  ) {
    super(injector);
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.insighterId = +params['id'];
      if (this.insighterId) {
        this.loadInsighterWalletDetails();
      }
    });
  }

  private loadInsighterWalletDetails(): void {
    this.isLoading = true;
    this.fundService.getInsighterWalletDetails(this.insighterId)
      .subscribe({
        next: (data) => {
          this.insighterData = data;
          this.isLoading = false;
        },
        error: (error) => {
          this.handleServerErrors(error);
          this.isLoading = false;
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

  goBack(): void {
    this.router.navigate(['/admin-dashboard/admin/fund/insighter-wallets']);
  }

  onPrint(): void {
    window.print();
  }

  onShareWhatsapp(): void {
    // TODO: Implement WhatsApp share
    this.showInfo('Info', 'WhatsApp share functionality coming soon');
  }

  onSendEmail(): void {
    // TODO: Implement email send
    this.showInfo('Info', 'Email send functionality coming soon');
  }
}
